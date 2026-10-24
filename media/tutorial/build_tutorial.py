from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import subprocess, shutil
import imageio_ffmpeg

ROOT=Path(__file__).resolve().parent
W,H=1280,720
BG='#F4F7F6'; DEEP='#102A2D'; TEAL='#087E73'; SOFT='#E6F4F1'; INK='#172326'; MUTED='#617074'; LINE='#D9E0DF'; WHITE='#FFFFFF'; AMBER='#F2A900'; RED='#B42318'; GREEN='#16774B'
FONT='/System/Library/Fonts/Supplemental/Verdana.ttf'; BOLD='/System/Library/Fonts/Supplemental/Verdana Bold.ttf'
def font(n,b=False): return ImageFont.truetype(BOLD if b else FONT,n)
def rr(d,box,r,fill,outline=None,w=1): d.rounded_rectangle(box,r,fill=fill,outline=outline,width=w)
def text(d,xy,s,size=24,color=INK,b=False,anchor=None): d.text(xy,s,font=font(size,b),fill=color,anchor=anchor)
def wrap(d,xy,s,width,size=24,color=INK,b=False,spacing=7):
    words=s.split(); lines=[]; line=''
    for word in words:
        test=(line+' '+word).strip()
        if d.textlength(test,font=font(size,b))<=width: line=test
        else: lines.append(line); line=word
    if line: lines.append(line)
    d.multiline_text(xy,'\n'.join(lines),font=font(size,b),fill=color,spacing=spacing)

def teacher(d,mouth=False,point=True):
    # body and jacket
    d.ellipse((65,185,295,415),fill='#C88762')
    d.pieslice((48,151,312,430),180,360,fill='#493228')
    d.ellipse((58,162,302,386),fill='#493228')
    d.ellipse((82,178,278,390),fill='#D69A76')
    d.polygon([(82,280),(62,610),(305,610),(276,280),(180,342)],fill='#0D5D59')
    d.polygon([(83,284),(180,342),(276,284),(220,610),(140,610)],fill='#FFFFFF')
    # eyes + glasses
    d.ellipse((117,245,132,260),fill=INK); d.ellipse((218,245,233,260),fill=INK)
    d.rounded_rectangle((95,226,151,273),10,outline=DEEP,width=4);d.rounded_rectangle((198,226,254,273),10,outline=DEEP,width=4);d.line((151,246,198,246),fill=DEEP,width=4)
    # nose and mouth
    d.line((176,256,168,292,184,292),fill='#8D563F',width=3)
    if mouth:d.ellipse((151,310,204,337),fill='#7D2C35')
    else:d.arc((150,294,205,332),0,180,fill='#7D2C35',width=4)
    # hair
    d.arc((78,160,282,383),190,350,fill='#493228',width=18)
    # arm pointing at screen
    if point:
        d.line((274,410,345,365),fill='#0D5D59',width=28);d.line((340,366,390,345),fill='#D69A76',width=18);d.polygon([(385,335),(418,341),(388,354)],fill='#D69A76')
    rr(d,(72,555,290,616),10,DEEP);text(d,(181,585),'ALBA · PROFESORA VIRTUAL',15,WHITE,True,'mm')

def chrome(d,title,step):
    rr(d,(350,70,1238,620),14,WHITE,LINE,2)
    d.rounded_rectangle((350,70,1238,130),14,fill=DEEP)
    d.rectangle((350,112,1238,130),fill=DEEP)
    rr(d,(370,86,406,119),7,'#20B8A9');text(d,(388,102),'CV',14,DEEP,True,'mm')
    text(d,(420,102),'Cuaderno Vivo',19,WHITE,True,'lm')
    text(d,(1188,102),f'{step}/6',15,'#A9C1BF',True,'rm')
    text(d,(382,157),title.upper(),13,TEAL,True)

def nav(d,active):
    items=['Crear','Escanear','Revisar','Refuerzo','Resultados']
    x=374
    for i,it in enumerate(items):
        fill=TEAL if i==active else '#EAF0EF'; col=WHITE if i==active else MUTED
        rr(d,(x,178,x+132,216),8,fill);text(d,(x+66,197),it,14,col,True,'mm');x+=140

def caption(d,title,body):
    rr(d,(35,640,1245,706),10,DEEP)
    text(d,(58,660),title,18,'#7FD9CE',True)
    text(d,(58,687),body,15,WHITE)

def scene(index,mouth=False):
    im=Image.new('RGB',(W,H),BG);d=ImageDraw.Draw(im)
    # permanent transparency label
    rr(d,(932,18,1243,52),17,'#E8E2FF');text(d,(1087,35),'SIMULACIÓN GENERADA CON IA',13,'#5136A3',True,'mm')
    if index==0:
        teacher(d,mouth,False)
        text(d,(385,148),'Conoce Cuaderno Vivo',44,INK,True)
        wrap(d,(388,218),'Una profesora virtual te acompaña por el ciclo completo: del papel a la evidencia de mejora.',760,27,MUTED,False,10)
        steps=[('1','CREAR'),('2','ESCANEAR'),('3','REVISAR'),('4','ACTUAR'),('5','COMPROBAR')]
        x=390
        for n,label in steps:
            d.ellipse((x,350,x+54,404),fill=TEAL);text(d,(x+27,377),n,20,WHITE,True,'mm');text(d,(x+27,430),label,14,INK,True,'mm')
            if n!='5': d.line((x+62,377,x+122,377),fill='#A7BCB9',width=4)
            x+=145
        caption(d,'Hola, soy Alba','Profesora virtual · datos de demostración · ninguna persona real')
        return im
    teacher(d,mouth,True)
    titles=['','Crear una actividad','Preparar las fichas','Escanear y revisar','Diagnosticar y actuar','Comprobar la mejora','El ciclo completo']
    chrome(d,titles[index],index);nav(d,min(index-1,4))
    if index==1:
        text(d,(380,248),'¿Qué quieres trabajar con tu clase?',27,INK,True)
        fields=[('ASIGNATURA','Matemáticas'),('NIVEL','5.º de Primaria'),('TEMA','Fracciones'),('ALUMNOS','24')]
        x=380
        widths=[190,190,250,120]
        for (lab,val),ww in zip(fields,widths):
            text(d,(x,292),lab,11,MUTED,True);rr(d,(x,312,x+ww,358),6,WHITE,'#AFC1BE',2);text(d,(x+12,335),val,16,INK);x+=ww+14
        rr(d,(380,388,920,461),7,'#F1F7F6');text(d,(402,410),'HABILIDADES',11,MUTED,True)
        chips=['Identificar','Comparar','Operar','Problemas'];cx=402
        for ch in chips: rr(d,(cx,428,cx+112,452),12,WHITE,'#A9C9C5');text(d,(cx+56,440),ch,11,TEAL,True,'mm');cx+=122
        rr(d,(960,390,1205,455),8,TEAL);text(d,(1082,422),'Crear 24 fichas  >',17,WHITE,True,'mm')
        caption(d,'Paso 1 · Crear','Elige asignatura, nivel, tema y número de alumnos.')
    elif index==2:
        text(d,(380,247),'24 fichas listas para imprimir',27,INK,True)
        for row in range(2):
            for col in range(4):
                n=row*4+col+1;x=382+col*198;y=290+row*125
                rr(d,(x,y,x+176,y+105),6,WHITE,'#B8C6C4',2);text(d,(x+14,y+18),f'A{n:02}',15,TEAL,True);text(d,(x+14,y+47),'FRACCIONES',12,MUTED,True)
                # QR-like square
                d.rectangle((x+122,y+18,x+158,y+54),outline=DEEP,width=3);d.rectangle((x+127,y+23,x+138,y+34),fill=DEEP);d.rectangle((x+143,y+38,x+153,y+49),fill=DEEP)
                d.line((x+14,y+76,x+158,y+76),fill=LINE,width=2)
        rr(d,(942,536,1206,588),8,TEAL);text(d,(1074,562),'Imprimir fichas',17,WHITE,True,'mm')
        caption(d,'Paso 2 · Papel','Cada QR identifica actividad, versión y código seudónimo; nunca el nombre.')
    elif index==3:
        # scanner panel
        rr(d,(382,245,737,555),9,'#142F31');
        d.polygon([(455,278),(675,300),(650,518),(430,487)],fill=WHITE)
        text(d,(472,318),'FRACCIONES · A07',13,INK,True);d.line((468,350,628,366),fill=LINE,width=3);d.line((462,389,623,404),fill=LINE,width=3);d.line((456,430,616,444),fill=LINE,width=3)
        for x,y in [(468,464),(505,467),(542,470),(579,473)]:d.ellipse((x,y,x+17,y+17),outline=INK,width=2)
        # review
        text(d,(770,247),'1 respuesta necesita revisión',21,INK,True)
        rr(d,(770,285,1204,400),8,'#FFF7E5','#E8C479',2);text(d,(792,310),'A07 · Pregunta 6',14,MUTED,True);text(d,(792,346),'Marca detectada: C',25,INK,True);text(d,(792,378),'Confianza 61 %',14,RED,True)
        opts=['A','B','C','D'];x=770
        for o in opts:rr(d,(x,425,x+92,474),7,SOFT if o=='C' else WHITE,TEAL if o=='C' else LINE,2);text(d,(x+46,449),o,19,TEAL if o=='C' else INK,True,'mm');x+=107
        rr(d,(952,505,1204,557),8,TEAL);text(d,(1078,531),'Confirmar respuesta',16,WHITE,True,'mm')
        caption(d,'Paso 3 · Revisar','La lectura está simulada. Una marca dudosa siempre la confirma la docente.')
    elif index==4:
        text(d,(380,245),'La dificultad está en operar fracciones',25,INK,True)
        skills=[('Identificar',86,GREEN),('Comparar',73,TEAL),('Operar',45,RED),('Problemas',59,AMBER)]
        y=290
        for name,val,col in skills:
            text(d,(385,y),name,15,INK,True);rr(d,(520,y,905,y+18),9,'#E4EAE9');rr(d,(520,y,520+int(3.85*val),y+18),9,col);text(d,(925,y+9),f'{val} %',15,INK,True,'lm');y+=55
        rr(d,(1000,280,1206,454),9,SOFT);text(d,(1020,306),'GRUPO FLEXIBLE',12,TEAL,True);text(d,(1020,344),'6 alumnos',28,INK,True);wrap(d,(1020,382),'Error común: suman también los denominadores.',165,14,MUTED)
        rr(d,(920,493,1206,552),8,TEAL);text(d,(1063,522),'Preparar refuerzo  >',16,WHITE,True,'mm')
        caption(d,'Paso 4 · Actuar','La app agrupa por patrón de error; la profesora elige la intervención.')
    elif index==5:
        text(d,(380,247),'Misma habilidad, pregunta diferente',25,INK,True)
        rr(d,(382,290,750,500),10,'#FFF4F2','#E4B1AA',2);text(d,(410,320),'ANTES',13,RED,True);text(d,(410,367),'0 / 2',54,RED,True);text(d,(410,440),'Operar con fracciones',16,MUTED)
        d.line((772,394,860,394),fill=TEAL,width=8);d.polygon([(860,380),(892,394),(860,408)],fill=TEAL)
        rr(d,(915,290,1205,500),10,'#EDF8F3','#9BCDB7',2);text(d,(943,320),'DESPUÉS',13,GREEN,True);text(d,(943,367),'2 / 2',54,GREEN,True);text(d,(943,440),'Mejora inmediata',16,MUTED)
        rr(d,(382,523,1205,574),7,'#F1F5F4');text(d,(408,548),'Siguiente decisión: comprobar retención más adelante.',15,INK,True,'lm')
        caption(d,'Paso 5 · Comprobar','La mejora inmediata es evidencia útil, pero todavía no garantiza dominio estable.')
    else:
        teacher(d,mouth,False)
        text(d,(430,260),'Papel  >  revisión  >  diagnóstico',30,INK,True)
        text(d,(430,320),'refuerzo  >  nueva actividad  >  mejora',30,TEAL,True)
        rr(d,(430,405,1120,500),10,DEEP);text(d,(775,436),'El error se convierte en la siguiente decisión docente',19,WHITE,True,'mm');text(d,(775,470),'y la aplicación comprueba si esa decisión funcionó.',17,'#B8D4D1',False,'mm')
        caption(d,'Ahora te toca a ti','Prueba el recorrido guiado dentro de Cuaderno Vivo.')
    return im

scenes=[(0,10),(1,16),(2,14),(3,17),(4,17),(5,16),(6,4)]
frames=ROOT/'frames';shutil.rmtree(frames,ignore_errors=True);frames.mkdir()
for idx,_ in scenes:
    for mouth in (False,True):scene(idx,mouth).save(frames/f's{idx}_{int(mouth)}.png',quality=95)
scene(0,False).save(ROOT/'poster.png')
concat=ROOT/'concat.txt'
with concat.open('w') as f:
    for idx,dur in scenes:
        ticks=int(dur*2)
        for n in range(ticks):
            f.write(f"file '{(frames/f's{idx}_{n%2}.png').as_posix()}'\n")
            f.write('duration 0.5\n')
    f.write(f"file '{(frames/'s6_0.png').as_posix()}'\n")
ff=imageio_ffmpeg.get_ffmpeg_exe();silent=ROOT/'tutorial-silent.mp4';final=ROOT/'tutorial-cuaderno-vivo.mp4'
subprocess.run([ff,'-y','-f','concat','-safe','0','-i',str(concat),'-vf','fps=30,format=yuv420p','-c:v','libx264','-preset','medium','-crf','22','-movflags','+faststart',str(silent)],check=True)
subprocess.run([ff,'-y','-i',str(silent),'-i',str(ROOT/'narracion.aiff'),'-c:v','copy','-c:a','aac','-b:a','160k','-shortest','-movflags','+faststart',str(final)],check=True)
print(final)
