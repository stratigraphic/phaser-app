<template>
	<b-tabs v-model="tabIndex" class="my-1">
		<b-tab v-for="nc in nodeClasses" :key="nc" class="my-2">
			<template v-slot:title>
				<span>{{ capitalize(nc) }}{{ nc !== "dating" ? "s" : "" }}</span>
				<b-badge pill 
					variant="outline" 
					class="border secondary pb-1 m-0 ml-2">
					<span>{{ itemCount(nc) }}</span>					
				</b-badge>
			</template>
			<ItemEditor :itemClass="nc"/>
		</b-tab> 

		<!--
		<b-tab>
			<template v-slot:title>
				<span>Problems</span>
				<b-badge pill variant="outline" class="border secondary pb-1 m-0 ml-2">
					<span>0</span>
				</b-badge>
			</template>
		</b-tab>
		-->
		<b-tab>
			<template v-slot:title>
				<span>Edges</span>
				<b-badge variant="outline" class="border secondary pb-1 m-0 ml-2">
					<span>{{ $store.getters.edges.length }}</span>
				</b-badge>
			</template>
			<ItemEditor itemClass="edge"/>
		</b-tab>

		<b-tab>
			<template v-slot:title>
				<span>Validation</span>
				<!--<b-badge variant="outline" class="border secondary pb-1 m-0 ml-2">
					<span>{{ 0 }}</span>
				</b-badge>-->
			</template>
			<Validation/>
		</b-tab>
		
    </b-tabs>
</template>

<script>
import PhaserCommon from '@/mixins/PhaserCommon.js'
import ItemEditor from '@/components/ItemEditor'
import Validation from '@/components/Validation'
import {NodeClass} from '@/mixins/constants.js'

export default {
	name: 'ItemEditors',
	components: {
		ItemEditor,
		Validation
	},
	mixins: [ PhaserCommon ],
	props: {},
	data() {
		return {
			tabIndex: 0
		}
	},
	computed: {
		selectedID() {
			return this.$store.getters.selectedID
		},
		nodeClasses() {
			return Object.values(NodeClass)
			//.filter(nc => nc !== NodeClass.FIND && nc !== NodeClass.SAMPLE) //deprecated these
		}		
	},
	watch: {
		selectedID(newValue) {			
			// display the tab containing the selected item
			let node = this.$store.getters.nodeByID(newValue)
			if(node) {
				let nc = node.data?.class || NodeClass.PHASE
				switch(nc) {
					case NodeClass.PHASE: this.tabIndex = 0;break;
					case NodeClass.GROUP: this.tabIndex = 1;break;
					case NodeClass.SUBGROUP: this.tabIndex = 2;break;
					case NodeClass.CONTEXT: this.tabIndex = 3;break;
					case NodeClass.DATING: this.tabIndex = 4;break;
					case NodeClass.PERIOD: this.tabIndex = 5;break;					
					default: break;
				}
			}
			else
				this.tabIndex = 5
		}
	},
	methods: {
		itemCount(nc) {
			switch(nc) {
				case NodeClass.PHASE: return this.$store.getters.phases.length
				case NodeClass.GROUP: return this.$store.getters.groups.length
				case NodeClass.SUBGROUP: return this.$store.getters.subgroups.length
				case NodeClass.CONTEXT: return this.$store.getters.contexts.length
				case NodeClass.DATING: return this.$store.getters.datings.length
				case NodeClass.PERIOD: return this.$store.getters.periods.length
				default: return 0
			}
		}
	},
	// lifecycle hooks
	beforeCreate() {},
	created() {},
	beforeMount() {},
	mounted() {},
	beforeUpdate() {},
	updated() {},
	beforeDestroy() {},
	destroyed() {}
}
</script>

<style scoped>
</style>