import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'

const scene = new THREE.Scene()
// scene.add(new THREE.AxesHelper(5))

const light = new THREE.PointLight()
light.position.set(0.8, 1.4, 1.0)
scene.add(light)

const ambientLight = new THREE.AmbientLight()
scene.add(ambientLight)

const camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 1, 2000)
camera.position.set(144, 133, 249)

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.target.set(0, 1, 0)

const clock = new THREE.Clock()

const dirLight = new THREE.DirectionalLight(0xffffff)
dirLight.position.set(0, 200, 100)
dirLight.castShadow = true
dirLight.shadow.camera.top = 180
dirLight.shadow.camera.bottom = -100
dirLight.shadow.camera.left = -120
dirLight.shadow.camera.right = 120
scene.add(dirLight)

// ground
const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2000, 2000),
    new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false })
)
mesh.rotation.x = -Math.PI / 2
mesh.receiveShadow = true
scene.add(mesh)

const grid = new THREE.GridHelper(2000, 20, 0x000000, 0x000000)
const material = grid.material as THREE.Material
material.opacity = 0.2
material.transparent = true
scene.add(grid)

let mixer: THREE.AnimationMixer

const fbxLoader = new FBXLoader()

fbxLoader.load(
    'model/avatar.fbx',
    (object) => {
        object.castShadow = true
        object.receiveShadow = true
        object.scale.set(2, 2, 2)
        object.position.x = -12

        mixer = new THREE.AnimationMixer(object)
        const clip = THREE.AnimationClip.findByName(object.animations, 'mixamo.com')
        const action = mixer.clipAction(clip)
        action.play()

        object.traverse(function (child) {
            if ((<THREE.Mesh>child).isMesh) {
                child.castShadow = true
                child.receiveShadow = true
            }
        })

        scene.add(object)
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
    },
    (error) => {
        alert(error)
    }
)

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)

    render()
}

function animate() {
    requestAnimationFrame(animate)
    const delta = clock.getDelta()
    if (mixer) mixer.update(delta)
    controls.update()
    render()
}

function render() {
    renderer.render(scene, camera)
}

animate()
