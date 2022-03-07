<template>
    <b-card no-body 
        v-b-toggle.legendItems             
        class="legend card  shadow text-secondary">
        <div class="card-header px-3 py-1">
            <b-icon-key class="mr-2"/>Key</div>
            <b-collapse id="legendItems" class="card-body m-0 px-3 py-1">               
            <b-list-group flush class="bg-light">
                <b-list-group-item v-for="(item, index) in items" :key="index" class="m-0 p-0 border-0">
                    <NodeIcon 
                        :width="30" 
                        :height="16" 
                        :dashed="item.dashed" 
                        :reversed="item.reversed"
                        :selected="item.selected" 
                        :nodeClass="item.nodeClass" 
                        :text="item.nodeClass.slice(0, 1).toUpperCase()"/>                    
                    <span class="ml-1">{{item.label}}</span>
                </b-list-group-item> 
            </b-list-group>                    
        </b-collapse>
    </b-card>    
</template>

<script>
import { NodeClass } from '@/composables/PhaserCommon'
import NodeIcon from '@/components/NodeIcon'
export default {
    components: { NodeIcon },
    setup() {	
        const items = [
            { label: "Phase", nodeClass: NodeClass.PHASE, dashed: true },
            { label: "Group", nodeClass: NodeClass.GROUP },
            { label: "Sub-Group", nodeClass: NodeClass.SUBGROUP },
            { label: "Context (undated)", nodeClass: NodeClass.CONTEXT },
            { label: "Context (dated)", nodeClass: NodeClass.CONTEXT, reversed: true },
            { label: "Selected", nodeClass: NodeClass.CONTEXT, selected: true },
        ]
        return { items }
    }
}
</script>

<style scoped>
    .legend { cursor: 'pointer' }
</style>