"""Build the small, offline PCM menu samples from the user-supplied reference."""
import argparse,base64,hashlib,json,pathlib,struct,wave
parser=argparse.ArgumentParser();parser.add_argument('source',type=pathlib.Path);args=parser.parse_args()
root=pathlib.Path(__file__).resolve().parent.parent
with wave.open(str(args.source)) as wav:
    assert wav.getnchannels()==1 and wav.getsampwidth()==2 and wav.getframerate()==22050,'Use mono PCM16 WAV at 22050 Hz'
    rate=wav.getframerate();source=wav.readframes(wav.getnframes())
cuts={'move':(.397,.650),'confirm':(2.735,3.580),'back':(3.940,4.730)}
samples={};segments={}
for name,(start,end) in cuts.items():
    raw=source[round(start*rate)*2:round(end*rate)*2];values=list(struct.unpack('<'+'h'*(len(raw)//2),raw));peak=max(abs(v) for v in values);gain=.85*32767/max(1,peak);fade=round(rate*.002)
    for i,value in enumerate(values):values[i]=round(value*gain*min(1,i/fade,(len(values)-1-i)/fade))
    pcm=struct.pack('<'+'h'*len(values),*values);samples[name]=base64.b64encode(pcm).decode();segments[name]={'start':start,'end':end,'seconds':len(values)/rate,'sha256':hashlib.sha256(pcm).hexdigest()}
payload={'sampleRate':rate,'encoding':'pcm16-mono','source':'https://www.youtube.com/watch?v=KxBt3xwYJXs','title':'Pes 2006 Sound Effects','sourcePcmSha256':hashlib.sha256(source).hexdigest(),'segments':segments,'samples':samples}
target=root/'js'/'menu-sounds.js';target.write_text("'use strict';\n// Short samples from the reference supplied by the user. See docs/SONS-DO-MENU.md.\nwindow.BSS.MENU_SAMPLES = Object.freeze("+json.dumps(payload,ensure_ascii=False,separators=(',',':'))+");\n",encoding='utf-8')
print(json.dumps({'bytes':target.stat().st_size,'segments':segments},ensure_ascii=False))
