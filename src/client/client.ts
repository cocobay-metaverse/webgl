import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

const scene = new THREE.Scene()
scene.background = new THREE.Color(0xa0a0a0)

const camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 1, 30000)
camera.position.set(-770, 276, 793)

const renderer = new THREE.WebGLRenderer({
    antialias: true,
})
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.target.set(0, 1, 0)

const clock = new THREE.Clock()

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3)
hemiLight.position.set(0, 200, 0)
scene.add(hemiLight)

const dirLight = new THREE.DirectionalLight(0xffffff)
dirLight.position.set(1000, 1500, -500)
dirLight.castShadow = true
dirLight.shadow.camera = new THREE.OrthographicCamera(-1500, 1500, 1800, -1800, 1000, 4000)
scene.add(dirLight)

// const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 5)
// scene.add(dirLightHelper)

// const dirLightCamHelper = new THREE.CameraHelper(dirLight.shadow.camera)
// scene.add(dirLightCamHelper)

function createPathStrings(filename: string) {
    const basePath = 'models/skybox/'
    const baseFilename = basePath + filename
    const fileType = '.bmp'
    const sides = ['ft', 'bk', 'up', 'dn', 'rt', 'lf']
    const pathStrings = sides.map((side) => {
        return baseFilename + '_' + side + fileType
    })
    return pathStrings
}

function createMaterialArray(filename: string) {
    const skyboxImagepaths = createPathStrings(filename)
    const materialArray = skyboxImagepaths.map((image) => {
        let texture = new THREE.TextureLoader().load(image)
        return new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide })
    })
    return materialArray
}

function loadSkybox() {
    const materialArray = createMaterialArray('Daylight')
    const skyboxGeo = new THREE.BoxGeometry(10000, 10000, 10000)
    const skybox = new THREE.Mesh(skyboxGeo, materialArray)
    skybox.castShadow = false
    scene.add(skybox)
}

let mixer: THREE.AnimationMixer

const gltfLoader = new GLTFLoader()
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderConfig({ type: 'js' })
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')
gltfLoader.setDRACOLoader(dracoLoader)

const fbxLoader = new FBXLoader()

gltfLoader.load(
    'models/island.gltf',
    function (gltf) {
        gltf.scenes.forEach((object) => {
            object.scale.set(5, 5, 5)
            object.traverse((childObject) => {
                const child: THREE.Mesh = <THREE.Mesh>childObject
                if (child.isMesh) {
                    const material = <THREE.Material>child.material
                    if (material.name == 'water_mat') {
                        child.castShadow = false
                        child.receiveShadow = true
                    } else if (material.name == 'island') {
                        child.castShadow = false
                        child.receiveShadow = true
                    } else {
                        child.castShadow = true
                        child.receiveShadow = true
                    }
                }
            })
            scene.add(object)
        })
        loadSkybox()
        loadAvatar()
    },
    function (xhr) {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
    },
    function (error) {
        console.log('An error happened', error)
    }
)

function loadAvatar() {
    fbxLoader.load(
        'models/avatar.fbx',
        (object) => {
            object.castShadow = true
            object.receiveShadow = true
            object.scale.set(2, 2, 2)
            object.position.set(-500, 140, 500)

            mixer = new THREE.AnimationMixer(object)
            const clip = THREE.AnimationClip.findByName(object.animations, 'mixamo.com')
            const action = mixer.clipAction(clip)
            action.play()

            object.traverse((child) => {
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
}

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
