<template>
	<b-tabs 
		v-model="tabIndex"
		class="my-1" 
		align="left" 
		active-nav-item-class="font-weight-bold"
		@activate-tab="activated">		
		<b-tab v-for="nc in nodeClasses"
			:key="nc" 
			class="my-2">
			<template v-slot:title>
				<NodeIcon :nodeClass="nc"/>
				<span>{{ `${nc}s [${itemCount(nc)}]` }}</span>				
			</template>
			<!--<keep-alive>-->
				<ItemEditor :selectedID="selectedID" :itemClass="nc"/>
			<!--</keep-alive>-->
		</b-tab>
		<b-tab
			:key="EdgeClass.EDGE" 
			class="my-2">
			<template v-slot:title>{{ `stratigraphy [${itemCount(EdgeClass.EDGE)}]` }}</template>
			<ItemEditor :selectedID="selectedID" :itemClass="EdgeClass.EDGE"/>
		</b-tab>

		<b-tab lazy>
			<template v-slot:title>Validation</template>
			<ValidationAsync/>
		</b-tab>
		<b-tab>
			<template v-slot:title>Temporal</template>
			<TemporalRelationships/>			
		</b-tab>
		<b-tab lazy>
			<template v-slot:title>Metadata</template>
			<MetaEditor/>
		</b-tab>	
		<b-tab>
			<template v-slot:title>Search<br>(experimental)</template>
			<SearchControls/>			
		</b-tab>
		<b-tab>
			<template v-slot:title>Group Matrix<br>(experimental)</template>
			<GroupMatrixTable/>					
		</b-tab>
    </b-tabs>
</template>

<script>
import { ref, unref, computed, watch, inject } from "@vue/composition-api" // Vue 2 only. for Vue 3 use "from '@vue'"
import ItemEditor from '@/components/ItemEditor'
import ValidationAsync from '@/components/ValidationAsync'
import MetaEditor from '@/components/MetaEditor'
import SearchControls from '@/components/SearchControls'
import TemporalRelationships from '@/components/TemporalRelationships'
import GroupMatrixTable from '@/components/GroupMatrixTable'
import NodeIcon from '@/components/NodeIcon'

import { NodeClass, EdgeClass } from '@/composables/PhaserCommon'

export default {
	components: {
		ItemEditor,
		ValidationAsync,
		MetaEditor,
		SearchControls,
		TemporalRelationships,
		GroupMatrixTable,
		NodeIcon
	},
	props: {
        // enables/disables the composite control
        selectedID: {
            type: String,
            required: false,
            default: ""
        }
	},  
	setup(props) {
		const store = inject('store')	
		const tabIndex = ref(0)
		const nodeClasses = Object.values(NodeClass) 
		
		// tab might get manually selected - ensure we are displaying correct info 
		// (e.g. selectedID might be context but selected tab might be groups..) 
		const activated = (newIndex) => { 
			let nc = store.getters.classByID(props.selectedID)
			let match = false
			switch(newIndex) {
				case 0: match = (nc == NodeClass.PHASE);break;
				case 1: match = (nc == NodeClass.GROUP);break;
				case 2: match = (nc == NodeClass.SUBGROUP);break;
				case 3: match = (nc == NodeClass.CONTEXT);break;
				case 4: match = (nc == NodeClass.DATING);break;
				case 5: match = (nc == NodeClass.PERIOD);break;
			}
			if(!match)
				store.dispatch("setSelectedID", null)
		}

		
		const itemCount = itemClass => {
			switch(itemClass) {
				case NodeClass.PHASE: return store.getters.phases.length
				case NodeClass.GROUP: return store.getters.groups.length
				case NodeClass.SUBGROUP: return store.getters.subgroups.length
				case NodeClass.CONTEXT: return store.getters.contexts.length
				case NodeClass.DATING: return store.getters.datings.length
				case NodeClass.PERIOD: return store.getters.periods.length
				case EdgeClass.EDGE: return store.getters.edges.length
				default: return 0
			}
		}

		// display tab corresponding to the currently selected item (may be node or edge)
		const selectedID1 = computed(() => props.selectedID)
		watch(selectedID1, (newID) => {			
			if(store.getters.isNode(newID)) {
				// if it's a node, display tab according to node.data.class
				let nc = store.getters.classByID(newID)			
				switch(nc) {
					case NodeClass.PHASE: tabIndex.value = 0;break;
					case NodeClass.GROUP: tabIndex.value = 1;break;
					case NodeClass.SUBGROUP: tabIndex.value = 2;break;
					case NodeClass.CONTEXT: tabIndex.value = 3;break;
					case NodeClass.DATING: tabIndex.value = 4;break;
					case NodeClass.PERIOD: tabIndex.value = 5;break;
				}
			}
			else if(store.getters.isEdge(newID)) {
				// if it's an edge, display edges tab	
				tabIndex.value = 6
			}
			else return					
		})
	
		return { 
			//edgeCount, 
			tabIndex,
			nodeClasses,
			EdgeClass, 
			itemCount,
			activated, 
			//capitalize 
		}
	}
}
</script>