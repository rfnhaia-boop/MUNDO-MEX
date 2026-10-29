import bpy, math, mathutils
from mathutils import Vector
SRC=r'C:\Users\rafael\Projetos\Ativos\shared\personagens\ravi-rosto.glb'
OUT=r'C:\Users\rafael\Projetos\Ativos\shared\personagens\ravi-rosto-rig.glb'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SRC)
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
bpy.ops.object.select_all(action='DESELECT')
for o in meshes: o.select_set(True)
bpy.context.view_layer.objects.active=meshes[0]
if len(meshes)>1: bpy.ops.object.join()
m=bpy.context.view_layer.objects.active; m.name='Ravi'
m.parent=None
# escala 1.8m, pés no chão, gira 180° em Z (frente passa a ser -Y), centra
m.scale=(1.8,1.8,1.8); m.location=(0,0,0.9)
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
m.rotation_euler=(0,0,math.pi); bpy.ops.object.transform_apply(location=False,rotation=True,scale=False)
zs=[v.co.z for v in m.data.vertices]; m.location.z=-min(zs); bpy.ops.object.transform_apply(location=True,rotation=False,scale=False)
print('altura',max(v.co.z for v in m.data.vertices))
# ---------- esqueleto ----------
arm=bpy.data.armatures.new('RaviArm'); ao=bpy.data.objects.new('RaviRig',arm); bpy.context.collection.objects.link(ao)
bpy.context.view_layer.objects.active=ao; ao.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
def bone(name,head,tail,parent=None,connect=False):
    b=arm.edit_bones.new(name); b.head=Vector(head); b.tail=Vector(tail)
    if parent: b.parent=arm.edit_bones[parent]; b.use_connect=connect
    return b
bone('hips',(0,0,0.95),(0,0,1.08))
bone('spine',(0,0,1.08),(0,0,1.28),'hips',True)
bone('chest',(0,0,1.28),(0,0,1.50),'spine',True)
bone('neck',(0,0,1.50),(0,0,1.58),'chest',True)
bone('head',(0,0,1.58),(0,0,1.80),'neck',True)
for s,sx in (('L',1),('R',-1)):
    bone('shoulder.'+s,(sx*0.05,0,1.46),(sx*0.19,0,1.44),'chest')
    bone('upper_arm.'+s,(sx*0.22,0,1.43),(sx*0.28,0,1.12),'shoulder.'+s)
    bone('forearm.'+s,(sx*0.28,0,1.12),(sx*0.285,0,0.86),'upper_arm.'+s,True)
    bone('hand.'+s,(sx*0.285,0,0.86),(sx*0.285,0,0.72),'forearm.'+s,True)
    bone('thigh.'+s,(sx*0.095,0,0.93),(sx*0.10,0,0.50),'hips')
    bone('shin.'+s,(sx*0.10,0,0.50),(sx*0.10,0,0.09),'thigh.'+s,True)
    bone('foot.'+s,(sx*0.10,0,0.09),(sx*0.10,-0.14,0.02),'shin.'+s,True)
bpy.ops.object.mode_set(mode='OBJECT')
# ---------- pesos por distância ao segmento ----------
vg={b.name:m.vertex_groups.new(name=b.name) for b in arm.bones}
segs={b.name:(Vector(b.head_local),Vector(b.tail_local)) for b in arm.bones}
def dist(p,a,b):
    ab=b-a; t=max(0,min(1,(p-a).dot(ab)/max(ab.dot(ab),1e-9))); return (p-(a+ab*t)).length
for v in m.data.vertices:
    p=v.co; ws=[]
    for n,(a,b) in segs.items():
        if n.startswith('shoulder'): continue
        d=dist(p,a,b); ws.append((1.0/((d+0.015)**4),n))
    ws.sort(reverse=True); ws=ws[:4]; tot=sum(w for w,_ in ws)
    for w,n in ws: vg[n].add([v.index],w/tot,'REPLACE')
mod=m.modifiers.new('Armature','ARMATURE'); mod.object=ao
m.parent=ao
# ---------- animações ----------
bpy.context.view_layer.objects.active=ao
bpy.ops.object.mode_set(mode='POSE')
pb=ao.pose.bones
for b in pb: b.rotation_mode='XYZ'
def key(frame,rots,loc=None):
    for b in pb: b.rotation_euler=(0,0,0)
    pb['hips'].location=(0,0,0)
    for n,(x,y,z) in rots.items(): pb[n].rotation_euler=(math.radians(x),math.radians(y),math.radians(z))
    if loc: pb['hips'].location=loc
    for b in pb:
        b.keyframe_insert('rotation_euler',frame=frame)
    pb['hips'].keyframe_insert('location',frame=frame)
def new_action(name,length,fn,step=1):
    act=bpy.data.actions.new(name); ao.animation_data_create(); ao.animation_data.action=act
    for f in range(1,length+2,step): fn(f,(f-1)/length)
    act.use_fake_user=True
    # empurra para uma trilha NLA p/ o exportador pegar todas
    tr=ao.animation_data.nla_tracks.new(); tr.name=name; st=tr.strips.new(name,1,act); ao.animation_data.action=None
S=math.sin; TAU=2*math.pi
def idle(f,t):
    key(f,{'spine':(1.2*S(TAU*t),0,0),'chest':(1.5*S(TAU*t),0,0),'head':(1.2*S(TAU*t+1),1.5*S(TAU*t),0),
           'upper_arm.L':(0,0,-2-1*S(TAU*t)),'upper_arm.R':(0,0,2+1*S(TAU*t))},(0,0.004*S(TAU*t),0))
def walk(f,t):
    a=S(TAU*t); c=math.cos(TAU*t)
    key(f,{'thigh.L':(30*a,0,0),'thigh.R':(-30*a,0,0),'shin.L':(max(0,-40*c),0,0),'shin.R':(max(0,40*c),0,0),
           'foot.L':(-10*a,0,0),'foot.R':(10*a,0,0),
           'upper_arm.L':(-22*a,0,-3),'upper_arm.R':(22*a,0,3),'forearm.L':(max(0,-18*a)-6,0,0),'forearm.R':(max(0,18*a)-6,0,0),
           'spine':(2,3*a,0),'chest':(0,-4*a,0),'head':(0,2*a,0)},(0,0.022*abs(c),0))
def talk(f,t):
    a=S(TAU*t); b=S(TAU*t*2)
    key(f,{'spine':(1,0,0),'head':(3*b,4*a,0),'chest':(1*a,0,0),
           'upper_arm.R':(-55-8*a,0,15+6*b),'forearm.R':(-45-15*b,0,0),'hand.R':(10*a,0,0),
           'upper_arm.L':(-10,0,-4),'forearm.L':(-22+4*a,0,0)})
def wave(f,t):
    a=S(TAU*t*3)
    key(f,{'upper_arm.R':(-20,0,150),'forearm.R':(0,0,25*a),'head':(2,-4,0),'upper_arm.L':(0,0,-3)})

def sit(f,t):
    a=S(TAU*t)
    key(f,{'thigh.L':(-88,0,0),'thigh.R':(-88,0,0),'shin.L':(88,0,0),'shin.R':(88,0,0),'foot.L':(5,0,0),'foot.R':(5,0,0),
           'spine':(2+1*a,0,0),'chest':(1.5*a,0,0),'head':(1.2*S(TAU*t+1),1.5*a,0),
           'upper_arm.L':(-38,0,-4),'forearm.L':(-32,0,0),'upper_arm.R':(-38,0,4),'forearm.R':(-32,0,0)},(0,-0.47,0))
def sit_talk(f,t):
    a=S(TAU*t); b=S(TAU*t*2)
    key(f,{'thigh.L':(-88,0,0),'thigh.R':(-88,0,0),'shin.L':(88,0,0),'shin.R':(88,0,0),'foot.L':(5,0,0),'foot.R':(5,0,0),
           'spine':(3,0,0),'chest':(1*a,0,0),'head':(3*b,4*a,0),
           'upper_arm.L':(-38,0,-4),'forearm.L':(-32,0,0),
           'upper_arm.R':(-70-8*a,0,14+6*b),'forearm.R':(-50-15*b,0,0),'hand.R':(10*a,0,0)},(0,-0.47,0))
new_action('idle',96,idle,4); new_action('walk',32,walk,2); new_action('talk',96,talk,4); new_action('wave',48,wave,2); new_action('sit',96,sit,4); new_action('sit_talk',96,sit_talk,4)
bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.object.select_all(action='DESELECT'); m.select_set(True); ao.select_set(True)
bpy.context.view_layer.objects.active=ao
bpy.ops.export_scene.gltf(filepath=OUT,export_format='GLB',use_selection=True,export_yup=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_skins=True,export_apply=False,export_image_format='AUTO')
print('EXPORT OK')
