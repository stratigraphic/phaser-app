<template>
    <b-container fluid class="p-0">
		<b-row align-h="between">			
			<b-col>
				<b-button pill
					v-if="itemClass !== 'edge'"
					size="sm"
					variant="outline-primary"
					class="text-left shadow" 
					:title="`add ${itemClass}`" 
					:alt="`add ${itemClass}`"			
					@click.stop="insertItem()">
					<b-icon-plus />Add {{ itemClass }}</b-button>
			</b-col>
			<b-col>
				<b-form-group
					label="Filter"
					label-for="filter-input"
					label-cols-sm="3"
					label-align-sm="right"
					label-size="sm"
					class="mb-2">
					<template v-slot:label>
						<b-icon-search />
					</template>
					<b-form-input 
						size="md"
						id="filter-input"
						class="shadow-sm"
						v-model="filter"
						type="search"
						autocomplete="off"
						:placeholder="`filter ${itemClass} records`"/>					
				</b-form-group>
			</b-col>
		</b-row>
		<b-row>
			<b-col>
				<b-table show-empty style="height: 250px;"
					id="datatable"
					sort-icon-left
					hover outlined selectable small 
					:no-border-collapse="true"
					sticky-header="300px" 
					select-mode="single"
					primary-key="id"
					:items="items" 
					:fields="fields"
					:filter="filter"
					class="overflow-auto shadow-sm"
					@row-selected="rowSelected">
					<template #cell(actions)="row">
						<div class="text-right">
							<b-icon-x-circle width="15" height="15"
								class="action mr-2" 
								:title="`delete ${itemClass} ${row.item.data.label}`" 
								:alt="`delete ${itemClass}`"							
								@click.stop="deleteItem(row.item)"/>		
						</div>				
					</template>					
				</b-table>
				<!--<div class="text-right">
					<b-icon-plus-circle
						class="action mr-2" 
						:title="`add ${itemClass}`" 
						:alt="`add ${itemClass}`"			
						@click.stop="createItem()"/>			
				</div>-->
			</b-col>
		</b-row>
	</b-container>
	
</template>

<script>
import PhaserCommon from '@/mixins/PhaserCommon.js'
import {NodeClass} from '@/mixins/constants.js'

export default {
	name: 'ItemTable',
	components: { },
	mixins: [ PhaserCommon ],
	props: {		
		itemClass: {
			type: String,
			required: false,
			default: NodeClass.PHASE,
			validator: value => [...Object.values(NodeClass), "edge"].includes(value)
		}
	},
	data() { 
		return {			
			filter: "",
			selectedID: "",
			sortBy: "data.label",
			sortDesc: false			
		}
	},
	computed: {
		items() {
			switch(this.itemClass) {
				case NodeClass.PHASE:
					return this.$store.getters.phases
				case NodeClass.GROUP:
					return this.$store.getters.groups
				case NodeClass.SUBGROUP:
					return this.$store.getters.subgroups
				case NodeClass.CONTEXT:
					return this.$store.getters.contexts
				case NodeClass.FIND:
					return this.$store.getters.finds
				case NodeClass.SAMPLE:
					return this.$store.getters.samples
				case NodeClass.DATING:
					return this.$store.getters.datings
				case NodeClass.PERIOD:
					return this.$store.getters.periods
				case "edge":
					return this.$store.getters.edges
				default:
					return []
			}
		},			
		columns() { 
			switch(this.itemClass) {
				case NodeClass.PHASE: return ["label", "enteredMinYear", "enteredMaxYear", "enteredDiff", "derivedMinYear", "derivedMaxYear", "duration", "period"]
				case NodeClass.GROUP: return ["label", "type", "parent", "derivedMinYear", "derivedMaxYear", "duration", "period"]
				case NodeClass.SUBGROUP: return ["label", "type", "parent", "derivedMinYear", "derivedMaxYear", "duration", "period"]
				case NodeClass.CONTEXT: return ["label", "type", "parent", "derivedMinYear", "derivedMaxYear", "duration", "period"]	
				case NodeClass.DATING: return ["label", "type", "parent", "enteredMinYear", "enteredMaxYear", "enteredDiff", "included", "period"]
				case NodeClass.PERIOD: return ["label", "enteredMinYear", "enteredMaxYear", "enteredDiff"]
				case "edge": return ["source", "type", "target", "derivedMinYear", "derivedMaxYear", "duration"]
				default: return []				
			}			
		},
		fields() {
			return [				
				/*{
					key: "data.id",
					label: "id",
					sortable: true					
				},*/
				// displaying label as if identifier
				... (this.columns.includes('label')) ? [{
					key: "data.label",
					label: "id",
					sortable: true					
				}] : [],
				... (this.columns.includes('period')) ? [{
					// virtual column with custom formatter
					key: 'period',
					label: 'period',
					sortByFormatted: true,
					formatter: this.tablePeriodFormatter,
					sortable: true					
				}] : [],
				... (this.columns.includes('source')) ? [{
					key: "data.source",
					label: "source",
					sortByFormatted: true,
					formatter: this.tableSourceIdFormatter,
					sortable: true					
				}] : [],  
				... (this.columns.includes('type')) ? [{
					key: "data.type",
					label: "type",
					sortable: true					
				}] : [],  
				... (this.columns.includes('target')) ? [{
					key: "data.target",
					label: "target",
					sortByFormatted: true,
					formatter: this.tableTargetIdFormatter,
					sortable: true					
				}] : [],   
				... (this.columns.includes('parent')) ? [{
					key: "data.parent",
					label: "within",
					sortByFormatted: true,
					formatter: this.tableParentFormatter,
					sortable: true					
                }] : [],                
				... (this.columns.includes('enteredMinYear')) ? [{
					// virtual column with custom formatter
					key: 'minyear',
					label: 'entered min year',
					sortByFormatted: true,
					formatter: this.tableMinYearFormatter,
					sortable: true,
					class: "text-right"
				}] : [],
				... (this.columns.includes('enteredMaxYear')) ? [{
					// virtual column with custom formatter
					key: 'maxyear',
					label: 'entered max year',
					sortByFormatted: true,
					formatter: this.tableMaxYearFormatter,
					sortable: true,
					class: "text-right"
					}] : [],
				... (this.columns.includes('enteredDiff')) ? [{
					// virtual column with custom formatter
					key: 'entereddiff',
					label: 'duration',
					sortByFormatted: true,
					formatter: this.enteredDiffFormatter,
					sortable: true,
					class: "text-right"
				}] : [],				
				... (this.columns.includes('derivedMinYear')) ? [{
					// virtual column with custom formatter
					key: 'derivedminyear',
					label: 'derived min year',
					sortByFormatted: true,
					formatter: this.derivedMinYearFormatter,
					sortable: true,
					class: "text-right"
				}] : [],
				
				... (this.columns.includes('derivedMaxYear')) ? [{
					// virtual column with custom formatter
					key: 'derivedmaxyear',
					label: 'derived max year',
					sortByFormatted: true,
					formatter: this.derivedMaxYearFormatter,
					sortable: true,
					class: "text-right"
				}] : [],
				... (this.columns.includes('duration')) ? [{
					// virtual column with custom formatter
					key: 'duration',
					label: 'duration',
					sortByFormatted: true,
					formatter: this.durationFormatter,
					sortable: true,
					class: "text-right"
				}] : [],				
				... (this.columns.includes('included')) ? [{
						key: "data.included",
						label: "included",	
						formatter: value => value ? "✓" : "✗",				
						sortable: true,
						class: "text-center"				
				}] : [],     
				/*{
					key: "data.dating.minYear",
					label: "min year",
					sortable: true
				},
				{
					key: "data.dating.maxYear",
					label: "max year",
					sortable: true
				},*/
				{ 	
					key: "actions", 
					label: ""
				}
			]		
		}
	},
	mounted() {},
	methods: {				
		insertItem() {
			let self = this
			switch(self.itemClass) {
				case NodeClass.PHASE: 
					self.$store.dispatch('insertPhase'); break;
				case NodeClass.GROUP: 
					self.$store.dispatch('insertGroup'); break;
				case NodeClass.SUBGROUP: 
					self.$store.dispatch('insertSubGroup'); break;
				case NodeClass.CONTEXT: 
					self.$store.dispatch('insertContext'); break;
				case NodeClass.DATING: 
					self.$store.dispatch('insertDating'); break;	
				case NodeClass.PERIOD: 
					self.$store.dispatch('insertPeriod'); break;				
			}
		},

		updateItem(item) {
			if(item) {
				if(this.itemClass == "edge")
					this.$store.dispatch('updateEdge', item)
				else
					this.$store.dispatch('updateNode', item)
			}

		},
			
		deleteItem(item) {
			let self = this
			self.$bvModal.msgBoxConfirm(`Delete ${ this.itemClass } "${item.data.label}" - are you sure?`)
				.then(value => { 
					if(value) { 
						this.$emit('itemDeleted', item.data.id)
						if(this.itemClass == "edge")
							this.$store.dispatch('deleteEdge', item)
						else
							this.$store.dispatch('deleteNode', item)
					}
				})		
		},
		
		/*selectItem(item) {
			this.selectedID = item.data.id
		},*/
		
		rowSelected(items) {
			if(items.length > 0) {
				this.$emit('itemSelected', items[0])				
			}	
		},
		tableSourceIdFormatter(value, key, item) {
			return(this.$store.getters.nodeLabel(item.data.source, true))
		},
		tableTargetIdFormatter(value, key, item) {
			return(this.$store.getters.nodeLabel(item.data.target, true))
		},
		// display node parent as label not id
		tableParentFormatter(value, key, item) {
			return(this.$store.getters.nodeLabel(item.data.parent, true))
		},	
		tablePeriodFormatter(value, key, item) {
			return(this.$store.getters.nodeLabel(item.data.period, false))
		},
		tableMinYearFormatter(value, key, item) {
			let dating = item.data.dating
            let year = dating.minYear
            let tolv = dating.minYearTolValue 						
            let tolu = dating.minYearTolUnit
            return this.tableYearFormat(year, tolv, tolu)
        },
        tableMaxYearFormatter(value, key, item) {
			let dating = item.data.dating
            let year = dating.maxYear
            let tolv = dating.maxYearTolValue 						
            let tolu = dating.maxYearTolUnit
            return this.tableYearFormat(year, tolv, tolu)
        },
        tableYearFormat(year, tolv, tolu) {
            if(year == null || year == "")
				return ""
			else if(tolv == 0)
				return Number(year) //`${year}`
			else
				return `${year}±${tolv}${tolu == "years" ? "y" : "%"}`
        },
		derivedMinYearFormatter(value, key, item) { 
			return this.$store.getters.derivedDates(item.data.id).minYear 
		},
		derivedMaxYearFormatter(value, key, item) { 
			return this.$store.getters.derivedDates(item.data.id).maxYear 
		},
		durationFormatter(value, key, item) {
			return this.$store.getters.derivedDuration(item.data.id) 
		},
		enteredDiffFormatter(value, key, item) {
			return this.$store.getters.enteredDuration(item.data.id) 
			//let dating = this.$store.getters.enteredNodeDates(item.data.id)
			//let dating = item.data.dating
            //return (dating.maxYear !== null && dating.minYear !== null) ? (dating.maxYear - dating.minYear) + 1 : null
		},
	}
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

