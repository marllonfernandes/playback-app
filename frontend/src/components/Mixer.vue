<template>
  <div class="flex gap-0.5 md:gap-6 overflow-x-auto h-full items-end justify-center pb-4 w-full">
    <div v-for="(stem, index) in stems" :key="stem.name" class="flex flex-col items-center justify-end gap-3 min-w-[40px] md:min-w-[70px] h-full group flex-1">
        
        <!-- Fader Track -->
        <div class="flex-1 relative w-full flex justify-center py-2 h-full">
            <div class="h-full relative flex justify-center w-full">
                 <!-- Background Track -->
                 <div class="absolute inset-y-0 w-1.5 bg-gray-800 rounded-full"></div>
                 <Slider v-model="stem.volume" orientation="vertical" class="!w-full h-full" :step="1" :max="100" />
            </div>
        </div>

        <!-- Controls -->
        <div class="flex flex-col gap-2 w-full px-1">
             <div class="flex flex-col gap-1 md:gap-1">
                <Button 
                    label="S" 
                    class="!w-full !h-7 !p-0 !text-[10px] !font-bold" 
                    :class="stem.solo ? '!bg-yellow-500 !text-black !border-none !shadow-[0_0_10px_#eab308]' : '!bg-gray-800 !text-gray-500 !border-gray-700'" 
                    @click="toggleSolo(index)" 
                    v-tooltip.top="'Solo'"
                />
                <Button 
                    label="M" 
                    class="!w-full !h-7 !p-0 !text-[10px] !font-bold" 
                    :class="stem.muted ? '!bg-red-500 !text-white !border-none !shadow-[0_0_10px_#ef4444]' : '!bg-gray-800 !text-gray-500 !border-gray-700'" 
                    @click="toggleMute(index)" 
                    v-tooltip.top="'Mute'"
                />
             </div>
             <span class="text-[8px] md:text-[10px] font-bold tracking-widest uppercase text-center text-gray-400 group-hover:text-white transition truncate">{{ stem.name }}</span>
        </div>
    </div>
    
    <!-- Master Separator -->
    <div class="h-1/2 w-px bg-white/10 mx-1 md:mx-2"></div>

    <!-- Master -->
    <div class="flex flex-col items-center justify-end gap-3 min-w-[40px] md:min-w-[70px] h-full flex-1">
         <div class="flex-1 relative w-full flex justify-center py-2 h-full">
             <div class="h-full relative flex justify-center w-full">
                 <div class="absolute inset-y-0 w-1.5 bg-gray-800 rounded-full"></div>
                 <Slider :modelValue="masterVolume" @update:modelValue="$emit('update:masterVolume', $event)" orientation="vertical" class="!w-full h-full master-fader" />
            </div>
        </div>
        <div class="w-full px-1 h-[68px] flex items-end justify-center"> <!-- Spacer to align with stems -->
             <span class="text-[8px] md:text-[10px] font-bold tracking-widest uppercase text-accent">Master</span>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Slider from 'primevue/slider';
import Button from 'primevue/button';

const props = defineProps({
    stems: Array,
    masterVolume: Number
});

defineEmits(['update:masterVolume']);

// No local ref masterVolume


const toggleMute = (index) => {
    props.stems[index].muted = !props.stems[index].muted;
};

const toggleSolo = (index) => {
    props.stems[index].solo = !props.stems[index].solo;
};
</script>

<style scoped>
/* Custom PrimeVue Slider Styling */
:deep(.p-slider-vertical) {
    background: transparent !important;
    width: 30px !important; /* Hit area width */
    position: relative;
}

/* Ruler / Ticks Background */
:deep(.p-slider-vertical)::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 4px; /* Adjust based on ruler width */
    width: 10px;
    background: repeating-linear-gradient(
        to bottom,
        #666 0px,
        #666 1px,
        transparent 1px,
        transparent 10px
    );
    opacity: 0.5;
    pointer-events: none;
}

/* The actual clickable range track */
:deep(.p-slider-range) {
    background: #000; /* Dark inner track */
    width: 6px !important;
    border-radius: 4px;
    left: 50% !important;
    transform: translateX(-50%);
    box-shadow: inset 0 0 4px #000;
}

/* Specific colored indicator inside the range (optional, if we want the "fill" to be colored)
   Actually, the image shows a black track with a green fill. 
   PrimeVue range is the fill. So we should make the range green.
*/
:deep(.p-slider-range) {
    background: theme('colors.accent');
    box-shadow: 0 0 10px theme('colors.accent');
}

/* The Handle / Knob */
:deep(.p-slider-handle) {
    width: 36px !important;
    height: 50px !important; /* Taller rectangular handle */
    border-radius: 3px !important;
    
    /* Metallic Gradient */
    background: linear-gradient(
        to bottom, 
        #888, 
        #ccc 20%, 
        #eee 40%, 
        #bbb 50%, 
        #888 51%, 
        #ccc 80%, 
        #888
    ) !important;
    
    border: 1px solid #222 !important;
    border-bottom-color: #000 !important;
    
    left: 50% !important;
    margin-left: -18px !important; /* Half of width */
    margin-bottom: -25px !important; /* Center vertically (half height) */
    
    box-shadow: 
        0 4px 6px rgba(0,0,0,0.8), 
        inset 0 1px 0 rgba(255,255,255,0.4),
        inset 0 0 2px rgba(0,0,0,0.5)
        !important;
        
    transition: transform 0.1s;
    z-index: 10;
}

/* Center line on the knob */
:deep(.p-slider-handle)::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: #222;
    box-shadow: 0 1px 0 rgba(255,255,255,0.5);
    margin-top: -0.5px;
}

@media (max-width: 768px) {
    :deep(.p-slider-handle) {
        width: 30px !important;
        margin-left: -15px !important;
        height: 40px !important;
        margin-bottom: -20px !important;
    }
}

:deep(.p-slider-handle):hover {
    filter: brightness(1.1);
}

:deep(.p-slider-handle):active {
    transform: scale(0.98);
    background: linear-gradient(to bottom, #777, #bbb 20%, #ddd 40%, #aaa 50%, #777 51%, #bbb 80%, #777) !important;
}

/* Master Fader Specifics */
.master-fader :deep(.p-slider-range) {
    background: #ef4444; /* Red for Master */
    box-shadow: 0 0 10px #ef4444;
}
.master-fader :deep(.p-slider-handle):active {
    /* Maintain metallic look but maybe tint it? Or just keep metallic. */
    filter: sepia(1) hue-rotate(-50deg) saturate(3); /* Reddish tint */
}
</style>
