<template>
    <a v-if="nodeID" href="#" @click.stop="store.dispatch('setSelectedID', nodeID)">
        <NodeIcon :nodeClass="nodeClass" :selected="false" :reversed="reversed"/>                        
        <span>{{ nodeLabel }}</span>
    </a>    
</template>
<script>
import { inject, computed } from '@vue/composition-api' // Vue 2 only. for Vue 3 use "from '@vue'"
import { NodeClass } from '@/composables/PhaserCommon'
import NodeIcon from '@/components/NodeIcon'

export default {
    components: { NodeIcon },
    props: {
        nodeID: {
            type: String,
            required: false,
            default: ""
        }
    },
	setup(props) {
        const store = inject('store')
        const nodeClass = computed(() => store.getters.classByID(props.nodeID))
        const nodeLabel = computed(() => store.getters.labelByID(props.nodeID))
        // const selected = computed(() => props.nodeID === store.getters.selectedID)        
        const reversed = computed(() => nodeClass.value == NodeClass.CONTEXT && store.getters.contextHasDating(props.nodeID))  
        
		return { store, reversed, nodeClass, nodeLabel }
	}
}
</script>
<style scoped>
a:hover {
	color: red;	
}
</style>