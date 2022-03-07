<template>
   <b-container class="border p-0 bg-light" fluid id="container">
        <b-row no-gutters id="header">
            <b-col>
                <MenuBar/>
            </b-col>
        </b-row>
        <vue-splitter :margin="10" :defaultPercent="60">
            <div slot="left-pane">
                <b-col>
                <MatrixDiagramCY/>
                </b-col>
            </div>
            <div slot="right-pane">
                <ItemEditors/>
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
        <!--<ComponentTemplateUsingCompositionAPI/>-->
        <div>{{ tolerance }}</div>
        <DatingYearTolerance 
            :tolerance-value="tolerance.value" 
            :tolerance-unit="tolerance.unit"             
            @change-value="toleranceValueChanged" 
            @change-unit="toleranceUnitChanged" />
        
    </b-container>
    
</template>

<script>
import MenuBar from '@/components/MenuBar'
import ItemEditors from '@/components/ItemEditors'
import MatrixDiagramCY from '@/components/MatrixDiagramCY' 

//import LayoutHeader from "@/components/LayoutHeader"
//import LayoutContent from "@/components/LayoutContent" 
//import LayoutSidebar from "@/components/LayoutSidebar" 
//import LayoutFooter from '@/components/LayoutFooter' 
import VueSplitter from "@rmp135/vue-splitter"
//import ComponentTemplateUsingCompositionAPI from "@/components/ComponentTemplateUsingCompositionAPI"
import DatingYearTolerance from "@/components/DatingYearTolerance"

export default { 
    name: 'Layout',
    components: { 
        //LayoutHeader,
        //LayoutContent,
        //LayoutSidebar,
        //ComponentTemplateUsingCompositionAPI,
        MenuBar,
        ItemEditors,
        MatrixDiagramCY,
        VueSplitter,
        DatingYearTolerance        
    },
    methods: {
       toleranceValueChanged(value){ this.tolerance.value = value },
       toleranceUnitChanged(value){ this.tolerance.unit = value }       
    },
    data: function(){ 
        return { 
            tolerance: {unit: "years", value: 5},                
            item: null 
        }
    }
}
</script>

<style scoped>

</style>