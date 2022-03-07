<template>
    <div>
        <!--<input v-model="state.selectedID" />-->
        <!--<div>{{ store1.selectedID }}</div>-->
        <!--<div v-for="n in nodes" :key="n.id">{{`${n.id} ${n.label}`}}</div>-->
    </div>
</template>

<script>
import { computed } from '@vue/composition-api' // Vue 2 only. for Vue 3 use "from '@vue'"
//import { getAppName, setAppName, appName, appVersion, selectedID } from "@/store/ministore.js"
//import { useStore } from 'vuex'
import store2 from '@/store/storeUsingObjectNotArray'   // for VUEX data

export default () => ({
    setup() {
        //const myStore = useStore()
        const myStore = store2 //useStore()           
        //const nodes = myStore.getters.nodes
        const nodes = computed(() => myStore.getters.nodes)
        console.log(nodes)
        //const  { getAppName, setAppName, getAppVersion, setAppVersion, selectedID } = useStore()
        //const selectedID = selectedID  
        //const getName = getAppName() 
        //return myStore
        return  { nodes } 
    }
})