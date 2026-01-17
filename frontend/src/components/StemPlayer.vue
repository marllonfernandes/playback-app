<template>
  <div class="hidden">
    <audio 
        ref="audioRef" 
        :src="src" 
        :loop="loop" 
        preload="auto"
        @timeupdate="onTimeUpdate"
        @loadedmetadata="onLoadedMetadata"
        @ended="$emit('ended')"
    ></audio>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';

const props = defineProps({
    src: String,
    volume: Number, // 0-100
    muted: Boolean,
    playing: Boolean,
    loop: Boolean,
    currentTime: Number,
    isPrimary: Boolean
});

const emit = defineEmits(['timeUpdate', 'durationChange', 'ended']);

const audioRef = ref(null);

const onTimeUpdate = () => {
    if (props.isPrimary && audioRef.value) {
        emit('timeUpdate', audioRef.value.currentTime);
    }
}

const onLoadedMetadata = () => {
    if (props.isPrimary && audioRef.value) {
        emit('durationChange', audioRef.value.duration);
    }
}

watch(() => props.playing, (newVal) => {
    if (newVal) audioRef.value?.play();
    else audioRef.value?.pause();
});

watch(() => props.volume, (newVal) => {
    if (audioRef.value) audioRef.value.volume = newVal / 100;
});

watch(() => props.muted, (newVal) => {
    if (audioRef.value) audioRef.value.muted = newVal;
});

// Sync time from parent transport
watch(() => props.currentTime, (newVal) => {
    // Only seek if difference is significant to avoid stutter
    if (audioRef.value && Math.abs(audioRef.value.currentTime - newVal) > 0.5) {
        audioRef.value.currentTime = newVal;
    }
});
</script>
