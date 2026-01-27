<script setup>
import { onMounted, ref, watch, onUnmounted } from 'vue';
import rough from 'roughjs';

const props = defineProps({
  percentage: {
    type: Number,
    required: true,
    default: 0
  },
  color: {
    type: String,
    default: '#93c5fd' // blue-300
  }
});

const canvasRef = ref(null);
let rc = null;
let animationFrame = null;
let offset = 0;

const draw = () => {
  if (!canvasRef.value) return;
  const canvas = canvasRef.value;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  ctx.clearRect(0, 0, width, height);
  
  if (!rc) rc = rough.canvas(canvas);
  
  // Calculate water height based on percentage (inverted because Y 0 is top)
  // Clamp percentage between 0 and 100
  const clampedPercent = Math.min(Math.max(props.percentage, 0), 100);
  const waterHeight = (clampedPercent / 100) * height;
  const topY = height - waterHeight;
  
  // Create a wavy top edge
  const points = [];
  const segments = 10;
  const segmentWidth = width / segments;
  
  for (let i = 0; i <= segments; i++) {
    const x = i * segmentWidth;
    const y = topY + Math.sin(offset + i * 0.8) * 5;
    points.push([x, y]);
  }
  
  // Add bottom corners to close the shape
  points.push([width, height]);
  points.push([0, height]);
  
  // Draw the main water body
  rc.polygon(points, {
    fill: props.color,
    fillStyle: 'hachure',
    hachureAngle: 60,
    hachureGap: 4,
    stroke: props.color,
    strokeWidth: 1,
    roughness: 1.5
  });
  
  // Draw an outline for the container (optional, but adds to the "hand-drawn" look)
  rc.rectangle(2, 2, width - 4, height - 4, {
    stroke: '#e2e8f0', // slate-200
    strokeWidth: 1,
    roughness: 0.5
  });
  
  offset += 0.05;
  animationFrame = requestAnimationFrame(draw);
};

onMounted(() => {
  // Set canvas size
  if (canvasRef.value) {
    const rect = canvasRef.value.parentElement.getBoundingClientRect();
    canvasRef.value.width = rect.width;
    canvasRef.value.height = rect.height;
  }
  draw();
});

onUnmounted(() => {
  if (animationFrame) cancelAnimationFrame(animationFrame);
});

// Handle resize
const handleResize = () => {
  if (canvasRef.value) {
    const rect = canvasRef.value.parentElement.getBoundingClientRect();
    canvasRef.value.width = rect.width;
    canvasRef.value.height = rect.height;
  }
};

window.addEventListener('resize', handleResize);
onUnmounted(() => window.removeEventListener('resize', handleResize));
</script>

<template>
  <div class="relative w-full h-full overflow-hidden">
    <canvas ref="canvasRef" class="w-full h-full"></canvas>
  </div>
</template>
