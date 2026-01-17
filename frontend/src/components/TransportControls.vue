<template>
  <div class="flex flex-col items-center justify-center gap-2">
    <!-- Buttons -->
    <div class="flex items-center gap-4">
        <!-- Prev Track -->
        <Button 
            icon="pi pi-step-backward" 
            text 
            rounded 
            class="!text-gray-400 hover:!text-white transition !w-10 !h-10" 
            aria-label="Previous Track"
            @click="$emit('prevTrack')"
        />

        <!-- Rewind 10s -->
        <Button 
            icon="pi pi-backward" 
            text 
            rounded 
            class="!text-gray-400 hover:!text-white transition !w-10 !h-10" 
            aria-label="Rewind 10s"
            @click="$emit('skip', -10)"
        />
        
        <!-- Play/Pause -->
        <div class="relative group">
             <div class="absolute inset-0 bg-accent/40 rounded-full blur-md opacity-0 group-hover:opacity-100 transition duration-500"></div>
             <Button 
                :icon="isPlaying ? 'pi pi-pause' : 'pi pi-play'" 
                @click="$emit('togglePlay')" 
                rounded 
                class="relative !w-14 !h-14 !bg-white !text-black !border-none !rounded-full hover:!scale-105 active:!scale-95 transition-all z-10 !text-xl shadow-lg shadow-black/20" 
                aria-label="Play"
            />
        </div>

        <!-- Forward 10s -->
        <Button 
            icon="pi pi-forward" 
            text 
            rounded 
            class="!text-gray-400 hover:!text-white transition !w-10 !h-10" 
            aria-label="Forward 10s"
            @click="$emit('skip', 10)"
        />

        <!-- Next Track -->
        <Button 
            icon="pi pi-step-forward" 
            text 
            rounded 
            class="!text-gray-400 hover:!text-white transition !w-10 !h-10" 
            aria-label="Next Track"
            @click="$emit('nextTrack')"
        />
    </div>
    
    <!-- Scrubber -->
    <div class="w-full max-w-md flex items-center gap-3 group">
        <span class="text-[10px] text-gray-500 font-mono group-hover:text-gray-300 transition w-8 text-right">{{ formatTime(currentTime) }}</span>
        <div class="flex-1 relative flex items-center h-4 cursor-pointer" @click="handleSeek">
             <!-- Background -->
             <div class="absolute inset-x-0 h-1 bg-gray-800 rounded-full overflow-hidden">
                 <!-- Progress -->
                 <div class="h-full bg-accent rounded-full relative" :style="{ width: percent + '%' }"></div>
             </div>
             <!-- Handle (only visible on group hover) -->
             <div class="absolute w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition -ml-1.5" :style="{ left: percent + '%' }"></div>
        </div>
        <span class="text-[10px] text-gray-500 font-mono group-hover:text-gray-300 transition w-8">{{ formatTime(duration) }}</span>
    </div>
  </div>
</template>

<script setup>
import Button from 'primevue/button';
import { computed } from 'vue';

const props = defineProps({
    isPlaying: Boolean,
    currentTime: { type: Number, default: 0 },
    duration: { type: Number, default: 0 }
});

const emit = defineEmits(['togglePlay', 'openPitch', 'seek', 'prevTrack', 'nextTrack', 'skip']);

const percent = computed(() => {
    if (!props.duration) return 0;
    return Math.min(100, Math.max(0, (props.currentTime / props.duration) * 100));
});

const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const handleSeek = (event) => {
    if (!props.duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
    const p = x / rect.width;
    const time = p * props.duration;
    emit('seek', time);
}
</script>
