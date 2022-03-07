<template>
	<b-form-group 
		label="Contains" 
		label-for="contains">

		<b-list-group 				
			name="contains"
			class="shadow-sm border overflow-auto" 
			style="height: 90px; resize: vertical;"   
			:disabled="disabled">
			<b-list-group-item v-for="(item, index) in items"
				class="px-2 py-0 m-0"							 
				:key="index">
				<NodeIconLink :nodeID="item.data.id"/>                							
			</b-list-group-item>
		</b-list-group>		
	</b-form-group>
</template>
<script>
import { inject, computed } from "@vue/composition-api" // Vue 2 only. for Vue 3 use "from '@vue'"
import { isPeriod } from '@/composables/PhaserCommon.js'
import NodeIconLink from '@/components/NodeIconLink'
export default {
    name: 'ItemContains',
	components: {
		NodeIconLink
    },
    props: {
        id: {
            type: String,
            required: false,
			default: null
        },
		disabled: {
			type: Boolean,
			required: false,
			default: false 
		}
    },
	setup(props) {
		const store = inject('store')		
		
        const items = computed(() => {
			let node = store.getters.nodeByID(props.id)
			if(node) {
				if(isPeriod(node)) {
					// list all nodes that reference this period
					return store.getters.nodes.filter(n => n.data.period == props.id)
				}
				else {
					// hierarchical containment relationships 
					// list all descendants of selected node
					return store.getters.descendantsOfID(props.id) 
				}
			}
			else
				return []
		})

        return { store, items }

	}
}
</script>
<style scoped>
a:hover {
	color:red;
}
</style>