<template>
   <b-container class="border p-0 bg-light" fluid id="container">
        <b-row no-gutters id="header">
            <b-col>
                <LayoutHeader/>
            </b-col>
        </b-row>
        <vue-splitter :margin="10" :defaultPercent="60">
            <div slot="left-pane">
                <b-col>
                <LayoutContent/>
                </b-col>
            </div>
            <div slot="right-pane">
                <LayoutSidebar/>
            </div>
        </vue-splitter>    
    </b-container>
</template>

<script>
import LayoutHeader from "@/components/LayoutHeader.vue"
import LayoutContent from "@/components/LayoutContent.vue" 
import LayoutSidebar from "@/components/LayoutSidebar.vue" 
//import LayoutFooter from '@/components/LayoutFooter.vue' 
import VueSplitter from "@rmp135/vue-splitter"

export default { 
    name: 'Layout',
    components: { 
        LayoutHeader,
        LayoutContent,
        LayoutSidebar,
        VueSplitter
        //LayoutFooter        
    },
    data: function(){ return{ item: null }}
}
</script>

<style scoped>

</style>