<template>
  <div class="h-screen w-full flex flex-col overflow-hidden text-white relative font-sans select-none">
    
    <!-- Background Glow -->
    <div class="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>

    <!-- Header -->
    <header class="h-16 shrink-0 flex items-center justify-between px-6 z-20 border-b border-white/5 bg-black/10 backdrop-blur-md">
       <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-emerald-700 flex items-center justify-center shadow-lg shadow-accent/20">
             <i class="pi pi-wave-pulse text-black text-sm font-bold"></i>
          </div>
          <h1 class="font-bold text-lg tracking-wide">PLAYBACK<span class="font-light text-gray-400">APP</span></h1>
       </div>
       <div class="flex items-center gap-3">
          <!-- Notification Pill -->
          <Transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0 translate-x-4" enter-to-class="opacity-100 translate-x-0" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100 translate-x-0" leave-to-class="opacity-0 translate-x-4">
            <div v-if="notification" class="bg-gray-900/90 backdrop-blur border border-white/10 rounded-full pl-3 pr-2 py-1.5 flex items-center gap-3 max-w-[250px] overflow-hidden">
                <i v-if="notification.type === 'loading'" class="pi pi-spin pi-spinner text-accent text-xs"></i>
                <i v-else-if="notification.type === 'error'" class="pi pi-times-circle text-red-500 text-xs"></i>
                <i v-else class="pi pi-check-circle text-green-500 text-xs"></i>
                <div class="flex flex-col min-w-0">
                    <p class="font-bold text-[10px] leading-tight truncate">{{ notification.title }}</p>
                    <p class="text-[9px] text-gray-400 leading-tight truncate" v-if="notification.message">{{ notification.message }}</p>
                </div>
                <Button icon="pi pi-times" text rounded size="small" class="!w-5 !h-5 !text-gray-500 hover:!text-white !p-0" @click="cancelJob" v-if="notification.type === 'loading'" />
                <Button icon="pi pi-check" text rounded size="small" class="!w-5 !h-5 !text-gray-500 !p-0" @click="notification = null" v-else />
            </div>
          </Transition>

          <Button label="Library" icon="pi pi-folder-open" text rounded size="small" class="!text-gray-300 hover:!text-white !font-medium" @click="showLibraryDialog = true" />
          <Button label="Upload" icon="pi pi-cloud-upload" rounded class="!bg-accent !text-black !font-bold !border-none !px-6 hover:!scale-105 transition-transform" @click="showAddDialog = true" />
       </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 min-h-0 relative flex flex-col items-center justify-center p-2 md:p-6 z-10">
        


        <!-- Mixer Container -->
        <div class="w-full max-w-6xl h-full flex flex-col">
             <div class="flex-1 bg-black/20 backdrop-blur-sm border border-white/5 rounded-3xl shadow-2xl overflow-hidden relative flex flex-col">
                 <!-- Decorative Header inside Mixer -->
                 <div class="h-12 border-b border-white/5 flex items-center px-6 justify-between bg-white/2">
                    <span class="text-xs font-bold text-gray-500 tracking-wider uppercase">Mixer Console</span>
                    <div class="flex gap-1.5">
                        <div class="w-2 h-2 rounded-full bg-red-500/20"></div>
                        <div class="w-2 h-2 rounded-full bg-yellow-500/20"></div>
                        <div class="w-2 h-2 rounded-full bg-green-500/20"></div>
                    </div>
                 </div>

                 <!-- The Mixer Component -->
                 <div class="flex-1 relative overflow-hidden">
                     <Mixer :stems="stems" v-model:masterVolume="masterVolume" class="h-full w-full" />
                 </div>
             </div>
        </div>

        <!-- Hidden Audio Players -->
        <StemPlayer 
            v-for="(stem, index) in stems" 
            :key="stem.name"
            :src="stem.url"
            :volume="(stem.solo ? 100 : (isAnySolo ? 0 : stem.volume)) * (masterVolume / 100)" 
            :muted="stem.muted"
            :playing="isPlaying"
            :currentTime="currentTime"
            :isPrimary="index === 0"
            @timeUpdate="onTimeUpdate"
            @durationChange="onDurationChange"
            @ended="isPlaying = false"
        />
    </main>

    <!-- Bottom Player Bar -->
    <footer class="h-24 shrink-0 bg-[#0a0a0a]/80 backdrop-blur-2xl border-t border-white/5 flex items-center px-8 z-30 gap-6">
       <!-- Song Info -->
       <div class="w-1/4 flex items-center gap-4">
          <div class="w-14 h-14 bg-gray-800 rounded flex items-center justify-center border border-white/5 shadow-inner group overflow-hidden relative shrink-0">
             <img v-if="currentThumbnail" :src="'http://localhost:3000' + currentThumbnail" class="w-full h-full object-cover z-20 relative" />
             <i v-else class="pi pi-music text-xl text-gray-500 group-hover:text-accent transition duration-500 relative z-10"></i>
             <div v-if="!currentThumbnail && currentTitle !== 'No Song Loaded'" class="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 group-hover:scale-110 transition duration-700"></div>
          </div>
          <div class="flex flex-col overflow-hidden">
             <span class="font-bold text-sm truncate text-white leading-tight">{{ currentTitle }}</span>
             <span class="text-xs text-accent/80 font-medium">Multitrack Audio</span>
          </div>
       </div>

       <!-- Transport Controls (Center) -->
       <div class="flex-1 flex justify-center">
            <!-- Passing styles to override TransportControls defaults -->
            <TransportControls 
                :isPlaying="isPlaying" 
                :currentTime="currentTime"
                :duration="duration"
                @togglePlay="isPlaying = !isPlaying" 
                @openPitch="showPitchDialog = true"
                @seek="seek"
                @prevTrack="prevTrack"
                @nextTrack="nextTrack"
                @skip="skip"
                class="!bg-transparent !border-none !h-auto !p-0 w-full max-w-lg"
            />
       </div>

       <!-- Extra Controls (Right) -->
       <div class="w-1/4 flex justify-end items-center gap-4">
            <div class="flex items-center gap-2 bg-white/5 rounded-full px-1 p-1 border border-white/5">
                 <Button icon="pi pi-sliders-v" text rounded size="small" class="!w-8 !h-8 !text-gray-400 hover:!text-white" v-tooltip="'Pitch & Key'" @click="showPitchDialog = true" />
                 <span class="text-xs font-mono text-gray-400 pr-3">{{ pitchShift > 0 ? '+' : '' }}{{ pitchShift }}st</span>
            </div>
       </div>
    </footer>

    <!-- ADD DIALOG -->
    <Dialog v-model:visible="showAddDialog" modal header="Upload Song" :style="{ width: '32rem' }" :pt="{ root: { class: 'bg-[#1a1a1a] border border-white/10' }, header: { class: 'bg-transparent border-b border-white/10 text-white' }, content: { class: 'bg-transparent text-white' }, footer: { class: 'bg-transparent border-t border-white/10' } }">
        <div class="flex flex-col gap-6 pt-2">
             <div class="flex flex-col gap-2">
                <label class="text-xs font-bold text-gray-400 uppercase">Separation Model</label>
                <Dropdown v-model="selectedOption" :options="separationOptions" optionLabel="division" optionValue="value" class="w-full" />
            </div>

            <!-- Toggle Mode -->
            <div class="flex gap-2 bg-white/5 p-1 rounded-lg">
                <Button label="File Upload" size="small" :class="uploadMode === 'file' ? '!bg-white/10 !text-white' : '!bg-transparent !text-gray-400'" class="!flex-1 !border-none" @click="uploadMode = 'file'" />
                <Button label="YouTube URL" size="small" :class="uploadMode === 'url' ? '!bg-white/10 !text-white' : '!bg-transparent !text-gray-400'" class="!flex-1 !border-none" @click="uploadMode = 'url'" />
            </div>

            <div v-if="uploadMode === 'file'">
                 <FileUpload 
                    mode="advanced" 
                    name="file" 
                    :customUpload="true" 
                    @uploader="onUpload" 
                    accept="audio/*" 
                    :maxFileSize="50000000"
                    chooseLabel="Select File"
                    uploadLabel="Process"
                    cancelLabel="Cancel"
                    :pt="{ 
                        root: { class: '!border-0 !bg-transparent' },
                        content: { class: '!bg-gray-800/50 !border !border-dashed !border-gray-600 !rounded-lg !p-8' } 
                    }"
                >
                    <template #empty>
                        <div class="flex flex-col items-center justify-center gap-3">
                            <i class="pi pi-cloud-upload text-3xl text-gray-500" />
                            <p class="text-sm text-gray-400">Drag and drop audio file here</p>
                        </div>
                    </template>
                </FileUpload>
            </div>

            <div v-else class="flex flex-col gap-4 py-4">
                 <input type="text" v-model="youtubeUrl" placeholder="Paste YouTube URL here..." class="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-accent transition placeholder-gray-600" />
                 <Button label="Process YouTube" icon="pi pi-youtube" @click="processYoutube" :disabled="!youtubeUrl" class="w-full !bg-red-600 hover:!bg-red-700 !text-white !border-none !font-bold" />
                 <p class="text-[10px] text-gray-500 text-center">Audio will be downloaded from the video and then separated.</p>
            </div>
        </div>
    </Dialog>
    
    <!-- PITCH DIALOG -->
     <Dialog v-model:visible="showPitchDialog" modal header="Key / Pitch Shift" :style="{ width: '20rem' }" :pt="{ root: { class: 'bg-[#1a1a1a] border border-white/10' }, header: { class: 'bg-transparent border-b border-white/10 text-white' }, content: { class: 'bg-transparent text-white' } }">
        <div class="flex flex-col gap-6 items-center py-4">
            <div class="text-4xl font-bold font-mono text-accent">{{ pitchShift > 0 ? '+' : '' }}{{ pitchShift }}</div>
            <div class="flex gap-4">
                <Button icon="pi pi-minus" @click="pitchShift--" rounded outlined class="!w-12 !h-12 !border-gray-600 hover:!border-white hover:!bg-white/10" />
                <Button icon="pi pi-plus" @click="pitchShift++" rounded outlined class="!w-12 !h-12 !border-gray-600 hover:!border-white hover:!bg-white/10" />
            </div>
             <Button label="Apply New Pitch" @click="applyPitch" :loading="processingPitch" class="w-full !bg-accent !text-black !font-bold !border-none" />
        </div>
    </Dialog>

    <!-- LIBRARY DIALOG -->
    <Dialog v-model:visible="showLibraryDialog" modal header="Music Library" :style="{ width: '50rem' }" :pt="{ root: { class: 'bg-[#1a1a1a] border border-white/10' }, header: { class: 'bg-transparent border-b border-white/10 text-white' }, content: { class: 'bg-transparent text-white' } }">
        <div v-if="libraryTracks.length === 0" class="flex flex-col items-center justify-center p-12 gap-4 text-gray-500">
            <i class="pi pi-folder-open text-5xl opacity-50"></i>
            <p>No tracks founds.</p>
        </div>
        <div v-else class="grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto p-1">
            <div 
                v-for="track in libraryTracks" 
                :key="track.id" 
                class="group p-3 rounded-lg hover:bg-white/5 cursor-pointer transition flex items-center justify-between border border-transparent hover:border-white/5"
                @click="loadTrack(track)"
            >
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 bg-gray-800 rounded flex items-center justify-center text-accent group-hover:scale-110 transition overflow-hidden">
                        <img v-if="track.thumbnail" :src="'http://localhost:3000' + track.thumbnail" class="w-full h-full object-cover" />
                        <i v-else class="pi pi-music"></i>
                    </div>
                    <div>
                        <div class="font-medium text-white group-hover:text-accent transition">{{ track.title }}</div>
                        <div class="text-xs text-gray-500">{{ track.model }}</div>
                    </div>
                </div>
                <div class="opacity-0 group-hover:opacity-100 transition flex gap-1">
                    <Button icon="pi pi-play" text rounded class="!text-white hover:!bg-white/20" />
                    <Button icon="pi pi-trash" text rounded severity="danger" class="!text-red-500 hover:!bg-red-500/20" @click.stop="deleteTrack(track)" />
                </div>
            </div>
        </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import TransportControls from './components/TransportControls.vue';
import Mixer from './components/Mixer.vue';
import StemPlayer from './components/StemPlayer.vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import FileUpload from 'primevue/fileupload';
import Dropdown from 'primevue/dropdown';
import { io } from "socket.io-client";

const isPlaying = ref(false);
const showAddDialog = ref(false);
const showLibraryDialog = ref(false);
const showPitchDialog = ref(false);
const processingPitch = ref(false);
const pitchShift = ref(0);
const currentTitle = ref('No Song Loaded');
const currentThumbnail = ref(null);
const notification = ref(null);
const libraryTracks = ref([]);
const masterVolume = ref(100);
const currentTime = ref(0);
const duration = ref(0);

const onTimeUpdate = (time) => {
    currentTime.value = time;
}

const onDurationChange = (dur) => {
    duration.value = dur;
}

const seek = (time) => {
    currentTime.value = time;
}

const socket = io('http://localhost:3000');

// Separation Options
const selectedOption = ref("-n htdemucs_6s"); // Default to 6s
const separationOptions = [
    { division: "htdemucs_6s (6 stems - Default)", value: "-n htdemucs_6s" },
    { division: "htdemucs_4s (Standard)", value: "-n htdemucs_4s" },
    { division: "vocals", value: "--two-stems=vocals" },
    { division: "drums", value: "--two-stems=drums" },
    { division: "bass", value: "--two-stems=bass" },
    { division: "other", value: "--two-stems=other" },
    { division: "vocals+drums", value: "--two-stems=vocals+drums" },
    { division: "vocals+bass", value: "--two-stems=vocals+bass" },
    { division: "vocals+other", value: "--two-stems=vocals+other" },
    { division: "drums+bass", value: "--two-stems=drums+bass" },
    { division: "drums+other", value: "--two-stems=drums+other" },
    { division: "bass+other", value: "--two-stems=bass+other" },
    { division: "vocals+drums+bass", value: "--two-stems=vocals+drums+bass" },
    { division: "vocals+drums+other", value: "--two-stems=vocals+drums+other" },
    { division: "vocals+bass+other", value: "--two-stems=vocals+bass+other" },
    { division: "drums+bass+other", value: "--two-stems=drums+bass+other" }, 
    { division: "vocals+drums+bass+other", value: "--two-stems=vocals+drums+bass+other" },
    { division: "htdemucs (Legacy)", value: "-n htdemucs" }
];


// Default stems structure
const stems = ref([
    { name: 'vocals', volume: 80, muted: false, solo: false, url: '' },
    { name: 'drums', volume: 80, muted: false, solo: false, url: '' },
    { name: 'bass', volume: 85, muted: false, solo: false, url: '' },
    { name: 'other', volume: 70, muted: false, solo: false, url: '' },
    { name: 'piano', volume: 75, muted: false, solo: false, url: '' },
    { name: 'guitar', volume: 75, muted: false, solo: false, url: '' },
]);

const isAnySolo = computed(() => stems.value.some(s => s.solo));

onMounted(async () => {
    socket.on('connect', () => {
        console.log('Connected to websocket');
    });

    socket.on('progress', (data) => {
        notification.value = {
            type: 'loading',
            title: 'Processing...',
            message: `${data.status} (${data.percent || 0}%)`,
            id: data.id
        };
    });

    socket.on('complete', (data) => {
        console.log('Job Complete:', data);
        notification.value = {
            type: 'success',
            title: 'Processing Complete',
            message: `Ready to play: ${data.title}`
        };
        
        loadTrack(data);
        
        // Auto dismiss after 5s
        setTimeout(() => notification.value = null, 5000);
        
        // Refresh library
        fetchLibrary();
    });

    socket.on('error', (data) => {
        console.error('Job Error:', data);
        notification.value = {
            type: 'error',
            title: 'Processing Failed',
            message: data.error
        };
    });
    
    // Initial fetch
    await fetchLibrary();
});

const fetchLibrary = async () => {
    try {
        const res = await fetch('http://localhost:3000/api/tracks');
        libraryTracks.value = await res.json();
    } catch (e) {
        console.error('Error fetching library', e);
    }
}

const loadTrack = (trackData) => {
    currentTitle.value = trackData.title;
    currentThumbnail.value = trackData.thumbnail;
    currentTime.value = 0;
    duration.value = 0;
    isPlaying.value = false;
    stems.value.forEach(stem => {
        if (trackData.stems && trackData.stems[stem.name]) {
            stem.url = `http://localhost:3000${trackData.stems[stem.name]}`;
        } else {
            stem.url = ''; 
        }
    });
    showLibraryDialog.value = false;
}

const currentTrackId = computed(() => {
    // Helper to identify current track instance
    // We can rely on title + model or verify if we store the full object
    // For simplicity, let's look up by title if unique or better, let loadTrack save the ID.
    return libraryTracks.value.find(t => t.title === currentTitle.value)?.id; 
});

const prevTrack = () => {
    if (libraryTracks.value.length === 0) return;
    const currentIndex = libraryTracks.value.findIndex(t => t.title === currentTitle.value);
    
    if (currentIndex > 0) {
        loadTrack(libraryTracks.value[currentIndex - 1]);
    } else {
        // Loop to last or do nothing? Let's loop.
        loadTrack(libraryTracks.value[libraryTracks.value.length - 1]);
    }
}

const nextTrack = () => {
    if (libraryTracks.value.length === 0) return;
    const currentIndex = libraryTracks.value.findIndex(t => t.title === currentTitle.value);
    
    if (currentIndex < libraryTracks.value.length - 1) {
        loadTrack(libraryTracks.value[currentIndex + 1]);
    } else {
        // Loop to first
        loadTrack(libraryTracks.value[0]);
    }
}

const skip = (amount) => {
    if (!duration.value) return;
    const newTime = Math.min(duration.value, Math.max(0, currentTime.value + amount));
    currentTime.value = newTime;
}

const onUpload = async (event) => {
    const file = event.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('options', selectedOption.value);

    try {
        const res = await fetch('http://localhost:3000/api/process', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        
        if (data.error) throw new Error(data.error);
        
        // Show initial notification
        showAddDialog.value = false;
        notification.value = {
            type: 'loading',
            title: 'Upload Successful',
            message: 'Starting separation task...',
            id: data.id
        };

    } catch (e) {
        console.error(e);
        alert(`Error processing song: ${e.message}`);
    }
}

const uploadMode = ref('file');
const youtubeUrl = ref('');

const processYoutube = async () => {
    if (!youtubeUrl.value) return;
    
    try {
        const res = await fetch('http://localhost:3000/api/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: youtubeUrl.value,
                options: selectedOption.value
            })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        showAddDialog.value = false;
        notification.value = { 
            type: 'loading', 
            title: 'YouTube Download Started', 
            message: 'Downloading audio from video...',
            id: data.id
        };
        youtubeUrl.value = ''; 
    } catch (e) {
        console.error(e);
        alert(`Error: ${e.message}`);
    }
}

const deleteTrack = async (track) => {
    if (!confirm(`Are you sure you want to delete "${track.title}"?`)) return;
    
    try {
        const res = await fetch(`http://localhost:3000/api/tracks/${encodeURIComponent(track.model)}/${encodeURIComponent(track.id)}`, {
            method: 'DELETE'
        });
        
        if (!res.ok) throw new Error("Failed to delete track");
        
        // Remove from list
        libraryTracks.value = libraryTracks.value.filter(t => t.id !== track.id);
        
        notification.value = {
            type: 'success',
            title: 'Track Deleted',
            message: `Removed ${track.title}`
        };
        setTimeout(() => notification.value = null, 3000);
        
    } catch (e) {
        console.error(e);
        alert("Error deleting track");
    }
}

const applyPitch = async () => {
    if (pitchShift.value === 0) {
        showPitchDialog.value = false;
        return;
    }
    processingPitch.value = true;
    try {
        for (const stem of stems.value) {
            if (!stem.url) continue;
            
            const res = await fetch('http://localhost:3000/api/pitch', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ 
                    filePath: stem.url.replace('http://localhost:3000', ''), // send relative path
                    semitones: pitchShift.value 
                })
            });
            const data = await res.json();
            stem.url = `http://localhost:3000${data.url}?t=${Date.now()}`; // Bust cache
        }
        showPitchDialog.value = false;
    } catch (e) {
        console.error(e);
        alert('Error changing pitch');
    } finally {
        processingPitch.value = false;
    }
}

const cancelJob = async () => {
    if (!notification.value || !notification.value.id) {
        notification.value = null;
        return;
    }
    
    try {
        const res = await fetch('http://localhost:3000/api/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: notification.value.id })
        });
        const data = await res.json();
        
        notification.value = {
            type: 'error',
            title: 'Cancelled',
            message: 'Process cancelled by user'
        };
        setTimeout(() => notification.value = null, 3000);
        
    } catch (e) {
        console.error("Error cancelling job:", e);
        notification.value = null;
    }
}
</script>
