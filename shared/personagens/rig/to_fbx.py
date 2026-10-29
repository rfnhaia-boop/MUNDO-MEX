import bpy, math
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=r'C:\Users\rafael\Projetos\Ativos\shared\personagens\ravi-rosto.glb')
objs=[o for o in bpy.context.scene.objects if o.type=='MESH']
print('meshes',[(o.name,len(o.data.polygons)) for o in objs])
# junta tudo em um mesh, escala para 1.8m, pés no chão, origem no centro dos pés
bpy.ops.object.select_all(action='DESELECT')
for o in objs: o.select_set(True)
bpy.context.view_layer.objects.active=objs[0]
if len(objs)>1: bpy.ops.object.join()
o=bpy.context.view_layer.objects.active
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
import mathutils
bb=[o.matrix_world@mathutils.Vector(c) for c in o.bound_box]
h=max(v.z for v in bb)-min(v.z for v in bb); k=1.8/h
o.scale=(k,k,k); bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
bb=[o.matrix_world@mathutils.Vector(c) for c in o.bound_box]
o.location.z-=min(v.z for v in bb); o.location.x-=(min(v.x for v in bb)+max(v.x for v in bb))/2; o.location.y-=(min(v.y for v in bb)+max(v.y for v in bb))/2
bpy.ops.object.transform_apply(location=True,rotation=False,scale=False)
print('altura final', max(v.z for v in [o.matrix_world@mathutils.Vector(c) for c in o.bound_box]))
bpy.ops.export_scene.fbx(filepath=r'C:\Users\rafael\Projetos\Ativos\shared\personagens\rig\ravi-rosto.fbx', use_selection=True, path_mode='COPY', embed_textures=True, axis_forward='-Z', axis_up='Y')
print('ok fbx')
