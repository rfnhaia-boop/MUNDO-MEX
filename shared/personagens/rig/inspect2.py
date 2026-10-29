import bpy, mathutils
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=r'C:\Users\rafael\Projetos\Ativos\shared\personagens\ravi-rosto.glb')
m=[o for o in bpy.context.scene.objects if o.type=='MESH'][0]
k=1.8/1.0
vs=[(v.co.x*k, v.co.y*k, (v.co.z+0.5)*k) for v in m.data.vertices]
print('N',len(vs))
for zi in range(0,19):
    z=zi*0.1
    sl=[v for v in vs if z<=v[2]<z+0.1]
    if not sl: continue
    xs=sorted(v[0] for v in sl); ys=[v[1] for v in sl]
    # gaps em x para achar braços
    gaps=[(xs[i+1]-xs[i],xs[i]) for i in range(len(xs)-1)]; g=max(gaps)
    print(f"z={z:.1f} x[{xs[0]:.2f},{xs[-1]:.2f}] y[{min(ys):.2f},{max(ys):.2f}] maiorGap={g[0]:.3f}@{g[1]:.2f}")
# frente: no topo (cabeça), onde estão os vértices mais extremos em y
head=[v for v in vs if v[2]>1.6]
print('cabeça y min/max', min(v[1] for v in head), max(v[1] for v in head), 'media', sum(v[1] for v in head)/len(head))
