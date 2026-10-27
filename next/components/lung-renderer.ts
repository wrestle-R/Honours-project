import * as THREE from "three";

/** Synthetic lungs on a curved depth mesh with ambient 3D particles.
 * Conceptual 2.5D anatomy, never a patient reconstruction or model explanation. */
export async function mountLungs(
  host: HTMLElement,
  { paused: initialPaused }: { paused: boolean },
) {
  const texture = await new THREE.TextureLoader().loadAsync(
    "/images/lungs-particles.webp",
  );
  texture.colorSpace = THREE.SRGBColorSpace;
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setClearColor(0x101211, 0);
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 0, 8.3);
  const root = new THREE.Group();
  scene.add(root);
  const aspect = texture.image.width / texture.image.height;
  const geometry = new THREE.PlaneGeometry(5.7 * aspect * 1.06, 5.7, 100, 120),
    position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i),
      y = position.getY(i),
      center = Math.sign(x) * 0.92;
    const depth =
      0.48 *
      Math.sqrt(
        Math.max(0, 1 - ((x - center) / 1.05) ** 2 - ((y + 0.3) / 2.3) ** 2),
      );
    position.setZ(i, Math.abs(x) < 0.18 ? 0.35 : depth);
  }
  geometry.computeVertexNormals();
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  root.add(new THREE.Mesh(geometry, material));
  let seed = 713;
  function random() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }
  const points: number[] = [],
    colors: number[] = [],
    warm = new THREE.Color("#d5bd92");
  for (let i = 0; i < 380; i++) {
    const theta = random() * Math.PI * 2,
      radius = 1.6 + random() * 1.3;
    points.push(
      Math.cos(theta) * radius,
      Math.sin(theta) * radius * 0.9,
      (random() - 0.5) * 1.3,
    );
    const color = warm.clone().multiplyScalar(0.2 + random() * 0.7);
    colors.push(color.r, color.g, color.b);
  }
  const pointGeometry = new THREE.BufferGeometry();
  pointGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(points, 3),
  );
  pointGeometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(colors, 3),
  );
  const pointMaterial = new THREE.PointsMaterial({
      size: 0.009,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    }),
    cloud = new THREE.Points(pointGeometry, pointMaterial);
  root.add(cloud);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d")!,
    gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,126,42,1)");
  gradient.addColorStop(0.3, "rgba(255,87,22,.5)");
  gradient.addColorStop(1, "rgba(255,60,10,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const heatTexture = new THREE.CanvasTexture(canvas),
    heatMaterial = new THREE.SpriteMaterial({
      map: heatTexture,
      transparent: true,
      opacity: 0,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
  const heat = new THREE.Sprite(heatMaterial);
  heat.position.set(0.85, -0.1, 0.7);
  heat.scale.set(1.3, 1.6, 1);
  root.add(heat);
  let paused = initialPaused,
    visible = true,
    disposed = false,
    frame = 0,
    lastTime = 0,
    elapsed = 0,
    targetX = 0,
    targetY = -0.035,
    dragging = false,
    previousX = 0,
    previousY = 0;
  function render() {
    if (!disposed) renderer.render(scene, camera);
  }
  function resize() {
    const { width, height } = host.getBoundingClientRect();
    renderer.setSize(width, height);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
    render();
  }
  function tick(time: number) {
    if (disposed) return;
    frame = requestAnimationFrame(tick);
    if (!visible || document.hidden || time - lastTime < 32) return;
    const delta = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;
    if (!paused) elapsed += delta;
    root.rotation.y +=
      (targetY +
        (!paused ? Math.sin(elapsed * 0.23) * 0.025 : 0) -
        root.rotation.y) *
      0.08;
    root.rotation.x += (targetX - root.rotation.x) * 0.08;
    const breath = paused ? 1 : 1 + Math.sin(elapsed * 0.65) * 0.007;
    root.scale.set(breath, breath, breath);
    cloud.rotation.z = elapsed * 0.006;
    render();
  }
  function down(e: PointerEvent) {
    dragging = true;
    previousX = e.clientX;
    previousY = e.clientY;
    host.setPointerCapture(e.pointerId);
  }
  function move(e: PointerEvent) {
    if (!dragging) return;
    targetY = THREE.MathUtils.clamp(
      targetY + (e.clientX - previousX) * 0.004,
      -0.38,
      0.38,
    );
    targetX = THREE.MathUtils.clamp(
      targetX + (e.clientY - previousY) * 0.003,
      -0.15,
      0.15,
    );
    previousX = e.clientX;
    previousY = e.clientY;
  }
  function up() {
    dragging = false;
  }
  function lost(e: Event) {
    e.preventDefault();
    host.dataset.context = "lost";
  }
  function restored() {
    delete host.dataset.context;
    resize();
  }
  host.addEventListener("pointerdown", down);
  host.addEventListener("pointermove", move);
  host.addEventListener("pointerup", up);
  host.addEventListener("pointercancel", up);
  renderer.domElement.addEventListener("webglcontextlost", lost);
  renderer.domElement.addEventListener("webglcontextrestored", restored);
  const resizer = new ResizeObserver(resize);
  resizer.observe(host);
  const observer = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
    },
    { rootMargin: "100px" },
  );
  observer.observe(host);
  resize();
  frame = requestAnimationFrame(tick);
  return {
    rotate(amount: number) {
      targetY = THREE.MathUtils.clamp(targetY + amount * 0.5, -0.38, 0.38);
    },
    reset() {
      targetY = -0.035;
      targetX = 0;
    },
    setPaused(value: boolean) {
      paused = value;
    },
    setAttention(value: boolean) {
      heatMaterial.opacity = value ? 0.53 : 0;
      render();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      resizer.disconnect();
      observer.disconnect();
      host.removeEventListener("pointerdown", down);
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerup", up);
      host.removeEventListener("pointercancel", up);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      renderer.domElement.removeEventListener("webglcontextrestored", restored);
      geometry.dispose();
      pointGeometry.dispose();
      material.dispose();
      pointMaterial.dispose();
      texture.dispose();
      heatTexture.dispose();
      heatMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
