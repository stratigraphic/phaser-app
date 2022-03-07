<template>
    <div>
        <!--<input v-model="state.selectedID" />-->
        <!--<div>{{ store1.selectedID }}</div>-->
        <div>{{ getAppName }}</div>
    </div>
</template>

<script>
//import { computed } from '@vue/composition-api' // Vue 2 only. for Vue 3 use "from '@vue'"
//import { getAppName, setAppName, appName, appVersion, selectedID } from "@/store/ministore.js"
import { getAppName, setAppName, getAppVersion, setAppVersion, selectedID } from "@/store/ministore.js"

//export default { getAppName: getAppName, setAppName, getAppVersion, setAppVersion, selectedID } 
export default {
    data() {return  { getAppName, setAppName, getAppVersion, setAppVersion, selectedID } },
    setup() {
        //const myStore = useStore()
        //const  { getAppName, setAppName, getAppVersion, setAppVersion, selectedID } = useStore()
        //const selectedID = selectedID  
        //const getName = getAppName() 
        //return myStore
        //return  { getName, setAppName, getAppVersion, setAppVersion, selectedID } 
    }
}