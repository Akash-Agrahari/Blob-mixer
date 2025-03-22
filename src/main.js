import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import vertex from '/shaders/vertex.glsl';
import { Text } from  'troika-three-text'
import textVertex from '/shaders/textVertex.glsl';
import gsap from 'gsap';


const blobs = [
  {
      name: 'Color Fusion',
      background: '#9D73F7',
      config: { "uPositionFrequency": .5, "uPositionStrength": 0.4, "uSmallWavePositionFrequency": 0.5, "uSmallWavePositionStrength": 0.7, "roughness": 1, "metalness": 0, "envMapIntensity": 0.5, "clearcoat": 0, "clearcoatRoughness": 0, "transmission": 0, "flatShading": false, "wireframe": false, "map": "cosmic-fusion" },
  },
  {
      name: 'Purple Mirror',
      background: '#5300B1',
      config: { "uPositionFrequency": 0.584, "uPositionStrength": 0.276, "uSmallWavePositionFrequency": 0.899, "uSmallWavePositionStrength": 1.266, "roughness": 0, "metalness": 1, "envMapIntensity": 2, "clearcoat": 0, "clearcoatRoughness": 0, "transmission": 0, "flatShading": false, "wireframe": false, "map": "purple-rain" },
  },
  {
      name: 'Alien Goo',
      background: '#45ACD8',
      config: { "uPositionFrequency": 1.022, "uPositionStrength": 0.99, "uSmallWavePositionFrequency": 0.378, "uSmallWavePositionStrength": 0.341, "roughness": 0.292, "metalness": 0.73, "envMapIntensity": 0.86, "clearcoat": 1, "clearcoatRoughness": 0, "transmission": 0, "flatShading": false, "wireframe": false, "map": "lucky-day" },
  },
]

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color('#333');
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const canvas = document.querySelector('canvas');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});


let isAnimating = false;
let currIndex = 0;
const loadingManager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader(loadingManager);
const rgbeloader = new RGBELoader(loadingManager);

const textMaterial = new THREE.ShaderMaterial({
  vertexShader: textVertex,
  fragmentShader: `void main() { gl_FragColor = vec4(1.0); }`,
  side: THREE.DoubleSide,
  uniforms: {
    progress : { value : 0.0},
    direction : { value : 1.0}
  }
})

const texts = blobs.map((blob, index) => {
  const mytext =  new Text()
  mytext.text = blob.name
  mytext.font = `./aften_screen.woff`
  mytext.anchorX = 'center'
  mytext.anchorY = 'middle'
  mytext.material = textMaterial
  mytext.position.set(0, 0, 2)
  if (index !== 0){
  mytext.scale.set(0,0,0);
  mytext.fillOpacity = .5;
}
  mytext.letterSpacing = -.1;
  mytext.fontSize = window.innerWidth / 3000
  mytext.fillOpacity = 1
  mytext.glyphGeometryDetail  = 20
  mytext.sync()
  scene.add(mytext)
  return mytext
})

// Set initial size
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;

// Add a light Hdri
rgbeloader.load("https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_08_1k.hdr",
 function(tex){
  tex.mapping =  THREE.EquirectangularReflectionMapping;
  scene.environment = tex;
 });

const uniforms = {
  uTime: { value: 0 },
  uPositionFrequency: { value: blobs[currIndex].config.uPositionFrequency },
  uPositionStrength: { value: blobs[currIndex].config.uPositionStrength },
  uTimeFrequency: { value: .3 },
  uSmallWavePositionFrequency: { value: blobs[currIndex].config.uSmallWavePositionFrequency },
  uSmallWavePositionStrength: { value: blobs[currIndex].config.uSmallWavePositionStrength },
  uSmallWaveTimeFrequency: { value: .3 },
};

// Add a simple cube
const material = new CustomShaderMaterial({
  vertexShader: vertex,
  uniforms: uniforms,
  baseMaterial: new THREE.MeshPhysicalMaterial({
    map: textureLoader.load(`./gradients/${blobs[currIndex].config.map}.png`),
    roughness: blobs[currIndex].config.roughness,
    metalness: blobs[currIndex].config.metalness,
    envMapIntensity: blobs[currIndex].config.envMapIntensity,
    clearcoat: blobs[currIndex].config.clearcoat,
    clearcoatRoughness: blobs[currIndex].config.clearcoatRoughness,
    transmission: blobs[currIndex].config.transmission,
    flatShading: blobs[currIndex].config.flatShading,
    wireframe: blobs[currIndex].config.wireframe,
  }),
});

const mergedGeo = mergeVertices(new THREE.IcosahedronGeometry(1, 70));
mergedGeo.computeTangents();

const cube = new THREE.Mesh(mergedGeo, material);
scene.add(cube);

camera.position.z = 3;

// Handle window resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize);

const clock = new THREE.Clock();

// Animation loop
loadingManager.onLoad = () => {
  function animate() {
    uniforms.uTime.value = clock.getElapsedTime();
    requestAnimationFrame(animate);  
    renderer.render(scene, camera);
  }

  const bg = new THREE.Color(blobs[currIndex].background);
  gsap.to(scene.background,{r: bg.r, g: bg.g, b: bg.b, duration: 1, ease: "power2.inOut"})

  animate();
}

let lastScrollTime = 0;
let scrollThreshold = 50; // Minimum delta to register as a valid scroll
let debounceTime = 500; // Wait time to prevent rapid multiple scrolls

window.addEventListener("wheel", (event) => {
  const now = Date.now();
  if (isAnimating || Math.abs(event.deltaY) < scrollThreshold || now - lastScrollTime < debounceTime) return;
  
  isAnimating = true;
  lastScrollTime = now;

  let direction = Math.sign(event.deltaY);
  let next = (currIndex + direction + blobs.length) % blobs.length;

  texts[next].scale.set(1, 1, 1);
  texts[next].position.x = direction * 3.5;

  gsap.to(textMaterial.uniforms.progress, {
    value: 0.5,
    duration: 1,
    ease: "power2.inOut",
    onComplete: () => {
      currIndex = next;
      isAnimating = false;
      textMaterial.uniforms.progress.value = 0;
    },
  });

  

  gsap.to(texts[currIndex].position, {
    x: -direction * 3,
    duration: 1,
    ease: "power2.inOut",
  });

  gsap.to(cube.rotation, {
    y: cube.rotation.y + Math.PI * 4 * -direction,
    duration: 1,
    ease: "power2.inOut",
  });
  

  gsap.to(texts[next].position, {
    x: 0,
    duration: 1,
    ease: "power2.inOut",
  });

  const bg = new THREE.Color(blobs[next].background);
  gsap.to(scene.background,{
    r: bg.r,  
    g: bg.g,
    b: bg.b,
    duration: 1,
    ease: "power2.inOut"
  })

  updateBlob(blobs[next].config);

});


function updateBlob(config)
{
  if(config.map !== undefined) {
    setTimeout(()=> {
      material.map = textureLoader.load(`./gradients/${config.map}.png`);
    },400)
  }
  if(config.uPositionFrequency !== undefined) gsap.to(material.uniforms.uPositionFrequency, {value: config.uPositionFrequency,duration: 1,ease: "power2.inOut",})
  if(config.uPositionStrength !== undefined) gsap.to(material.uniforms.uPositionStrength, {value: config.uPositionStrength,duration: 1,ease: "power2.inOut",})
  if(config.uSmallWavePositionFrequency !== undefined) gsap.to(material.uniforms.uSmallWavePositionFrequency, {value: config.uSmallWavePositionFrequency,duration: 1,ease: "power2.inOut",})
  if(config.uSmallWavePositionStrength !== undefined) gsap.to(material.uniforms.uSmallWavePositionStrength, {value: config.uSmallWavePositionStrength,duration: 1,ease: "power2.inOut",})
  if(config.roughness !== undefined) gsap.to(material, {roughness: config.roughness,duration: 1,ease: "power2.inOut",})
  if(config.metalness !== undefined) gsap.to(material, {metalness: config.metalness,duration: 1,ease: "power2.inOut",})
  if(config.envMapIntensity !== undefined) gsap.to(material.baseMaterial, {envMapIntensity: config.envMapIntensity,duration: 1,ease: "power2.inOut",})
  if(config.clearcoat !== undefined) gsap.to(material.baseMaterial, {clearcoat: config.clearcoat,duration: 1,ease: "power2.inOut",})
  if(config.clearcoatRoughness !== undefined) gsap.to(material.baseMaterial, {clearcoatRoughness: config.clearcoatRoughness,duration: 1,ease: "power2.inOut",})
  if(config.transmission !== undefined) gsap.to(material.baseMaterial, {value: config.transmission,duration: 1,ease: "power2.inOut",})
  if(config.flatShading !== undefined) gsap.to(material.baseMaterial, {flatShading: config.flatShading,duration: 1,ease: "power2.inOut",})
  if (config.wireframe !== undefined) gsap.to(material.baseMaterial, {wireframe: config.wireframe, duration: 1, ease: "power2.inOut",})
  
}
