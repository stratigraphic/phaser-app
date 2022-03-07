<template>    
    <b-container class="border p-0 bg-light" fluid id="container">
        <b-row no-gutters id="header">
            <b-col>
                <MenuBar/>
            </b-col>
        </b-row>
        <!--<b-row><b-col><ComponentTemplateUsingCompositionAPI/></b-col></b-row>-->
        <!--<b-row no-gutters id="header">
            <b-col>
                <testStore2/>
            </b-col>
        </b-row>-->
        <!--<b-row><testMiniStore/></b-row>-->
        <vue-splitter :margin="10" :defaultPercent="50">
            <div slot="left-pane">
                <b-col>
                   <MatrixDiagramCY/>
                </b-col>
            </div>
            <div slot="right-pane">
                <ItemEditors :selectedID="store.getters.selectedID"/>
            </div>            
            <!--<slot name="left-pane">
                <b-col>
                <LayoutContent/>
                </b-col>
            </slot>
            <slot name="right-pane">
                <LayoutSidebar/>
            </slot>-->
        </vue-splitter>        
    </b-container>     
</template>

<script>
import { onMounted, inject } from '@vue/composition-api' // Vue 2 only. for Vue 3 use "from '@vue'"
import MenuBar from '@/components/MenuBar'
import ItemEditors from '@/components/ItemEditors'
import MatrixDiagramCY from '@/components/MatrixDiagramCY'
import VueSplitter from "@rmp135/vue-splitter"
//import ComponentTemplateUsingCompositionAPI from "@/components/ComponentTemplateUsingCompositionAPI"
//import DatingYearTester from '@/components/DatingYearTester'
//import testStore2 from '@/components/testStore2'
export default { 
    components: { 
        MenuBar,
		ItemEditors,
		MatrixDiagramCY,
		VueSplitter,
        //ComponentTemplateUsingCompositionAPI
        //DatingYearTester
        //testStore2
    },
	setup () {
        const store = inject('store')
        
		onMounted(() => document.title = `${store.getters.appName} v${store.getters.appVersion}`)

        return { store }
	}       
}      
</script>

<style>
html, body {
	margin: 0;
	padding: 0;
	height: 100%; /* needed for container min-height */
	font-size: small
}
</style>