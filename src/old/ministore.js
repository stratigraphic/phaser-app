import { reactive, computed } from '@vue/composition-api' // Vue 2 only. for Vue 3 use "from '@vue'"

const state = reactive({
    appName: "Phaser",      // application name
    appVersion: "1.0",       // application version
    selectedID: "5",        // ID of currently selected node 
})

export const getAppName = computed(() => state.appName)
export const setAppName = (newValue) => state.appName = newValue

export const getAppVersion = computed(() => state.appVersion)
export const setAppVersion = (newValue) => state.appVersion = newValue

// will this work? combined getter and setter
export const selectedID = computed({ 
    get: () => state.selectedID, 
    set: (value) => state.selectedID = value 
})

/*export const ministore = readonly({  
    state,
    getAppName, 
    setAppName, 
    getAppVersion, 
    setAppVersion, 
    selectedID 
})*/