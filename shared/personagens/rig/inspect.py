import bpy, mathutils, json
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=r'C:\Users\rafael\Projetos\Ativos\shared\personagens\ravi-rosto.glb')
m=[o for o in bpy.context.scene.objects if o.type=='MESH'][0]
print('rot',m.rotation_euler, 'scale',m.scale, 'parent', m.parent and m.parent.name)
vs=[m.matrix_world@v.co for v in m.data.vertices]
zs=[v.z for v in vs]; ys=[v.y for v in vs]; xs=[v.x for v in vs]
print('bbox x',min(xs),max(xs),'y',min(ys),max(ys),'z',min(zs),max(zs))
# eixo vertical: o maior extent
ext=[max(xs)-min(xs),max(ys)-min(ys),max(zs)-min(zs)]; print('ext',ext)
