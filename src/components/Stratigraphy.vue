<template>
<div>
    <b-form-group label="Stratigraphy">		
		<b-form-row>
			<b-col>
				<b-form-group label="Source context">
					<b-form-input text 
						:disabled="true"
						class="shadow-sm" 
						placeholder="source" 
						type="text"
						name="itemID" 
						:value="$store.getters.nodeLabel(sourceID)"/>
						<!--v-model.trim="((selectedItem || {}).data || {}).id"/>-->
				</b-form-group>
			</b-col>
			<b-col>	
				<b-form-group label="Relationship">	
					<b-form-select 
						:disabled="this.disabled"
						name="edgeTypeSelector" 
						class="shadow-sm"                
						placeholder="relationship"
						v-model="selectedEdgeType"
						:options="edgeTypes.map(t => { return { value: t, text: t } })"/>
				</b-form-group>					
			</b-col>
			<b-col>
				<b-form-group label="Target context">	
					<ItemLookup
						label=""
						:disabled="disabled" 
						:optionNone="false"					
						:options="available"
						placeholder="target"
						v-model="selectedTargetID"
						@change="targetChanged"/>
				</b-form-group>	
			</b-col>
			<b-col>	
				<b-form-group label=".">			
				<b-button pill
					size="sm"
					:disabled="disabled || sourceID == ''" 
					variant="outline-primary"
					class="text-left shadow" 
					title="add" 
					alt="add"			
					@click.stop="addItem">
					<b-icon-plus />
					<span>Add relationship</span>
				</b-button>
				</b-form-group>
			</b-col>
		</b-form-row>
		<b-form-row>
			<b-col v-for="edgeType in edgeTypes" :key="edgeType"  class="border">
				<b-form-group :label="capitalize(edgeType)">					
					<ul class="list-inline d-inline-block m-1" name="lst">
						<li v-for="item in items(edgeType)" :key="item.id" class="list-inline-item">
							<b-badge
								:title="item.id"
								class="bg-white text-dark border border-secondary shadow-sm"
								:disabled="disabled">
								<!--<span>{{ $store.getters.nodeByID(item.data.target).data.label || item.data.target }}</span>-->
								<span>{{ $store.getters.nodeLabel(item.data.target) }}</span>
								<b-icon-x-circle class="action ml-2" @click.stop="removeItem(item)"/>
							</b-badge>
						</li>
					</ul>					
				</b-form-group>				
			</b-col>
			<b-col></b-col>
		</b-form-row>		
	</b-form-group>
</div>
</template>

<script>
import PhaserCommon from '@/mixins/PhaserCommon.js'
import ItemLookup from '@/components/ItemLookup'

export default {
	name: 'Stratigraphy2',
	components: { ItemLookup },
	mixins: [ PhaserCommon ],
	props: {
		disabled: {
			type: Boolean,
			required: false,
			default: false
		},
		sourceID: {
			type: String,
			required: false,
			default: ""
		}
	},
	data() {
		return {
			edgeTypes: ["above", "below", "equal"],
			selectedTargetID: "",	
			selectedEdgeType: "above"		
		}
	},
	computed: {
		strat() { return this.$store.getters.edgesBySource(this.sourceID) },
		above() { return this.strat.filter(e => e.data.type == "above") },
		below() { return this.strat.filter(e => e.data.type == "below") },
		equal() { return this.strat.filter(e => e.data.type == "equal") },
		options() { return this.$store.getters.contextOptionsGrouped },	
		available() { 
			// target IDs for strat relationships. Exclude existing targets or current source ID
			const currentTargets = this.strat.map(item => item.data.target).concat([this.sourceID])
			const currentOptions = this.options.length > 0 ? this.options[0].options || [] : []			
			return currentOptions.filter(option => !currentTargets.includes(option.value))			
		}
	},
	methods: {
		items(edgeType){
			switch(edgeType) {
				case "above": return this.above
				case "below": return this.below
				case "equal": return this.equal
				default: return []
			}
		},
		addItem() {			
			let edge = { 
				data: { 
					source: this.sourceID, 
					target: this.selectedTargetID, 
					type: this.selectedEdgeType 
				} 
			}
			this.$store.dispatch('insertEdge', edge)	
		},
		removeItem(item) {
			this.$store.dispatch('deleteEdge', item)			
		},
		targetChanged(value) {
			this.selectedTargetID = value			
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
.action { 
	cursor: pointer;
	color:dodgerblue;
}
.action:hover {
	color:red;
}
</style>