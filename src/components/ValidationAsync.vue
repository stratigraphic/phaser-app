<template>
    <b-container fluid class="p-2">
		<b-row align-h="between">	
            <b-col>
				<b-button pill
					size="sm"
					:disabled="isBusy"
					variant="primary"
					class="text-left shadow" 
					title="Redo validation" 
					alt="Redo validation"			
					@click.stop="refresh()">
					<b-icon-arrow-clockwise />Redo validation</b-button>
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
						size="sm"
						id="filter-input"
						class="shadow-sm"
						v-model="filter"
						type="search"
						autocomplete="off"
						placeholder="filter validation records"/>	
						<div class="text-secondary">Showing {{ filterCount }} of {{ tests.length }} records</div>				
				</b-form-group>
			</b-col>
		</b-row>
		<b-row>
			<b-col>
				<b-table show-empty sort-icon-left outlined small
					style="height: 600px;"
					id="datatable"
					:busy="isBusy"					 
					:no-border-collapse="true"
					sticky-header="600px" 
					select-mode="single"					
					primary-key="id"
					:items="tests" 
					:fields="fields"
					:filter="filter"
					@filtered="onFiltered"						
					class="overflow-auto shadow-sm mb-2"
					:tbody-tr-class="tableRowClass">
					<template #table-busy>
						<div class="text-center text-danger my-2">
							<b-spinner class="align-middle"></b-spinner>
							<strong>Validating...</strong>
						</div>
					</template>
					<template #cell(actions)="row">						
						<b-icon-caret-down title="show details" v-if="row.item.failed.value > 0" size="sm" @click="row.toggleDetails"/>										
					</template>	
					<template #cell(result)="row">						
						<TickOrCross :value="row.item.failed.value ? false : (row.item.tested.value ? true : null)"/>										
					</template>							
					<template #row-details="row">
						<b-list-group>
							<b-list-group-item v-if="row.item.failed.value > 0" :variant="row.item.optional ? 'warning' : 'danger'">									
								<strong>
									<span>{{ `${row.item.failed.value} failed` }}</span>
									<span v-if="row.item.failed.value > maxResults" class="ml-1">{{ `(showing first ${maxResults} only)` }}</span>
									<span>:<br></span>
								</strong>
								
								<NodeIconLink v-for="id in row.item.failedIDs.value.slice(0, maxResults)" 									
									:key="id"									
									:nodeID="id"
									class="mr-3" />								
							</b-list-group-item>																				
						</b-list-group>						
					</template>								
				</b-table>								
			</b-col>
		</b-row>
	</b-container>    
</template>

<script>
import { ref, unref, shallowRef, watch, inject, computed } from '@vue/composition-api' // Vue 2 only. for Vue 3 use "from '@vue'"
import { NodeClass, EdgeType, isContext  } from "@/composables/PhaserCommon"
import NodeIconLink from '@/components/NodeIconLink'
import TickOrCross from '@/components/TickOrCross'
//import { NodeClass, labelByID, rangeAfter, isValidRange, isContext } from "@/composables/PhaserCommon"

export default {
	components: { NodeIconLink, TickOrCross },	
	setup() {
		const store = inject('store')  
		const isBusy = ref(false)
		const filter = ref("")
		const onFiltered = (items, count) => filterCount.value = count
        const sortBy = ref("test")
		const sortDesc = ref(false)	
		const maxResults = 20

		const fields = [			
			{
				// virtual column with custom formatter
				key: "result",
				label: "result",
                sortByFormatted: true,
				formatter: (value, key, item) => unref(item.failed) ? false : (unref(item.tested) ? true : null),
				sortable: true,
				class: "text-center"														
			},
			{
				key: "testName",
				label: "description",
				formatter: (value, key, item) => item.title,
                sortable: true														
			},
			{
				key: "tested",
				label: "tested",
                sortByFormatted: true,
				formatter: (value, key, item) => unref(item.tested),
				sortable: true,
				class: "text-right"													
			},
			{
				key: "passed",
				label: "✓ passed",
				sortByFormatted: true,
				formatter: (value, key, item) => unref(item.passed),
                sortable: true,
				class: "text-right"														
			},
			{
				key: "failed",
				label: "✗ failed",
				sortByFormatted: true,
				formatter: (value, key, item) => unref(item.failed),
                sortable: true,
				class: "text-right"														
			},			
			{ key: 'actions', label: '' }			
        ]
		
        const tableRowClass = (item, type) => {			
			if (!item || type !== 'row') 
				return "table-light"
			if(unref(item.tested) == 0)	
				return "table-light"
			if (unref(item.failed) > 0) 
				if(item.optional) return 'table-warning'
				else return 'table-danger' 
			else return 'table-success'
		}  

		const setSelectedID = id => store.dispatch('setSelectedID', id) 
			
		const testNodeDescendantsContainContext = (node) => store.getters
			.descendantsOfID(node?.data?.id)
			.some(node => node.data?.class == NodeClass.CONTEXT)


		const testNodeAllocatedToPhase = (node) => store.getters
			.ancestorsOfNode(node)
			.some(item => item.data.class == NodeClass.PHASE)	
			
		const testNodeAllocatedToGroup = (node) => store.getters
			.ancestorsOfNode(node)
			.some(item => [NodeClass.GROUP, NodeClass.SUBGROUP].includes(item.data.class))

		const testNodeAllocatedToPeriod = (node) => node?.data?.period ? true : false

		class tester {
			constructor(title="New test", optional=false) {
				this.id = title
				this.title = title
				this.optional = optional
				this.isBusy = ref(false)
				this.tested = ref(0)			// count of tested items
				this.failedIDs = shallowRef([])	// ID of failed items	
				this.failed = computed(() => unref(this.failedIDs).length)	
				this.passed = computed(() => unref(this.tested) - unref(this.failed))											
			}
			async rerun() {
				// set busy indicator
				this.isBusy.value = true

				// clear any previous results
				this.tested.value = 0
				this.failedIDs.value.length = 0

				// run the test function asynchronously				
				const response = await this.test()
				this.tested.value = response.tested || 0
				this.failedIDs.value = (response.failedIDs || [])

				// unset busy indicator
				this.isBusy.value = false
			}
			// override this - returns tested count, and failed IDs
			async test() { 
				return { tested: 0, failedIDs: [] } 
			}
		}

		class PhasesMustContainContext extends tester {
			constructor() { 
				super("Phases MUST contain at least one context", false) 
			}
			async test() {
				let results = { tested: 0, failedIDs: [] }
				store.getters.phases.forEach(async phase => {
					if(!testNodeDescendantsContainContext(phase)) {
						results.failedIDs.push(phase.data.id)
					}
					results.tested++

				})
				return results				
			}
		}

		class PhasesShouldDefineDateRange extends tester {
			constructor() {
				super("Phases SHOULD define a date range", true)				
			}
			async test() {
				let results = { tested: 0, failedIDs: [] }
				store.getters.phases.forEach(async phase => {
					if(!(phase.data.dating.minYear && phase.data.dating.maxYear)) {	
						results.failedIDs.push(phase.data.id)
					}
					results.tested++					
				})
				return results
			}
		}

		class PhasesShouldBeAllocatedToPeriod extends tester {
			constructor() {
				super("Phases SHOULD be allocated to a period", true)				
			}
			async test() {
				let results = { tested: 0, failedIDs: [] }
				store.getters.phases.forEach(async phase => {
					if(!testNodeAllocatedToPeriod(phase)) { 
						results.failedIDs.push(phase.data.id)
					}
					results.tested++		
				})
				return results
			}
		}

		class GroupContainsAtLeastOneContext extends tester {
			constructor() {
				super("Groups MUST contain at least one context", false)				
			}
			async test() {
				let results = { tested: 0, failedIDs: [] }
				store.getters.groups.forEach(async group => {
					if(!testNodeDescendantsContainContext(group)) {
						results.failedIDs.push(group.data.id)
					}
					results.tested++							
				})
				return results
			}			
		}

		class GroupMustBeAllocatedToPhase extends tester {
			constructor() {
				super("Groups MUST be allocated to a phase", false)				
			}
			async test() {
				let results = { tested: 0, failedIDs: [] }
				store.getters.groups.forEach(async group => {	
					if(!testNodeAllocatedToPhase(group)) {
						results.failedIDs.push(group.data.id)
					}
					results.tested++							
				})	
				return results		
			}
		}

		class GroupShouldBeAllocatedToPeriod extends tester {
			constructor() {
				super("Groups SHOULD be allocated to a period", true)				
			}
			async test() {
				let results = { tested: 0, failedIDs: [] }
				store.getters.groups.forEach(async group => {									
					if(!testNodeAllocatedToPeriod(group)) {
						results.failedIDs.push(group.data.id)
					}
					results.tested++					
				})
				return results
			}				
		}

		class SubgroupMustContainContext extends tester {
			constructor() {
				super("Subgroups MUST contain at least one context", false)				
			}
			async test() {
				let results = { tested: 0, failedIDs: [] }
				store.getters.subgroups.forEach(async subgroup => {	
					if(!testNodeDescendantsContainContext(subgroup)) {
						results.failedIDs.push(subgroup.data.id)
					}
					results.tested++					
				})	
				return results		
			}
		}

		class SubgroupParentMustBeGroup extends tester {
			constructor() {
				super("Subgroups MUST be allocated to a group", false)				
			}
			async test() {
				let results = { tested: 0, failedIDs: [] }			
				store.getters.subgroups.forEach(async subgroup => {
					let parent = store.getters.nodeByID(subgroup.data.parent)				
					if(!(parent?.data?.class == NodeClass.GROUP)) {
						results.failedIDs.push(subgroup.data.id)
					}
					results.tested++
				})
				return results
			}
		}

		class SubgroupMustBeAllocatedToPhase extends tester {
			constructor() {
				super("Subgroups MUST be allocated to a phase", false)				
			}
			async test() {	
				let results = { tested: 0, failedIDs: [] }
				store.getters.subgroups.forEach(async subgroup => {
					if(!testNodeAllocatedToPhase(subgroup)) {
						results.failedIDs.push(subgroup.data.id)
					}
					results.tested++			
				})
				return results
			}
		}

		class SubgroupShouldBeAllocatedToPeriod extends tester {
			constructor() {
				super("Subgroups SHOULD be allocated to a period", true)				
			}
			async test() {
				let results = { tested: 0, failedIDs: [] }
				store.getters.subgroups.forEach(async subgroup => {		
					if(!testNodeAllocatedToPeriod(subgroup)) {
						results.failedIDs.push(subgroup.data.id)
					}
					results.tested++					
				})
				return results			
			}
		}

		class ContextMustBeAllocatedToPhase extends tester {
			constructor() {
				super("Contexts MUST be allocated to a phase", false)				
			}
			async test() {
				let results = { tested: 0, failedIDs: [] }
				store.getters.contexts.forEach(async context => {		
					if(!testNodeAllocatedToPhase(context)) {
						results.failedIDs.push(context.data.id)
					}
					results.tested++				
				})
				return results
			}
		}

		class ContextShouldBeAllocatedToPeriod extends tester {
			constructor() {
				super("Contexts SHOULD be allocated to a period", true)				
			}
			async test() {
				let results = { tested: 0, failedIDs: [] }
				store.getters.contexts.forEach(async context => {	
					if(!testNodeAllocatedToPeriod(context)) { 
						results.failedIDs.push(context.data.id)
					}
					results.tested++				
				})
				return results
			}
		}

		class ContextShouldBeAllocatedToGroup extends tester {
			constructor() {
				super("Contexts SHOULD be allocated to a group (or subgroup)", true)				
			}
			async test() {
				let results = { tested: 0, failedIDs: [] }
				store.getters.contexts.forEach(async context => {	
					if(!testNodeAllocatedToGroup(context)) { 
						results.failedIDs.push(context.data.id)
					}
					results.tested++				
				})
				return results
			}
		}

		class ContextShouldHaveType extends tester {
			constructor() {
				super("Contexts SHOULD have a type", true)				
			}
			async test() {
				let results = { tested: 0, failedIDs: [] }
				store.getters.contexts.forEach(async context => {
					if((context.data?.type || "").trim() == "") {
						results.failedIDs.push(context.data.id)
					}
					results.tested++				
				})
				return results
			}
		}

		class ContextPositionMustReflectStratigraphy extends tester {
			constructor() {
				super("Context positions in diagram MUST reflect stratigraphy", false)				
			}
			async test() {
				let results = { tested: 0, failedIDs: [] }
				store.getters.edges
					.filter(edge => edge.data.type == EdgeType.ABOVE)
					.forEach(edge => {
						let sourceNode = store.getters.nodeByID(edge.data.source)
						let targetNode = store.getters.nodeByID(edge.data.target)

						if(isContext(sourceNode) && isContext(targetNode)) {
							
							if(!(sourceNode.position.y < targetNode.position.y)) {
								results.failedIDs.push(edge.data.id)								
							}
							results.tested++				
						}
					})
				return results
			}
		}

		/*
		// this was slowing everything down... rewritten to be more efficient		
		class ContextStratigraphySupportedByDating extends tester {
			constructor() {
				super("Context stratigraphy supported by dating evidence?", false)				
			}
			async test() {
				let results = { tested: 0, failedIDs: [] }
				
				// local cache instead of using store.getters.derivedNodeDates
				// runs much faster as it is built directly from dating records
				let contextDerivedDates = new Map()
				store.getters.datings
					.filter(dating => dating.data.included)
					.forEach(dating => {
						// date extents, accounting for any tolerances
						let range = store.getters.enteredDatesForNode(dating)
						if(isValidRange(range)) {
							// get current derived range if we have it, or create a new one
							let derived = contextDerivedDates.get(dating.data.parent) || { minYear: Number.POSITIVE_INFINITY, maxYear: Number.NEGATIVE_INFINITY }
							// less than the current derived minimum?
							if(derived.minYear > range.minYear) derived.minYear = range.minYear
							// more than the current derived maximum?
							if(derived.maxYear < range.maxYear) derived.maxYear = range.maxYear 
							// save derived range 
							contextDerivedDates.set(dating.data.parent, derived)
						}
					})
				
				// only considering edges connecting contexts with dates
				store.getters.edges
					.filter(edge => contextDerivedDates.has(edge.data.source) && contextDerivedDates.has(edge.data.target) && edge.data.type == "above")
					.forEach(edge => {
						let rangeA = contextDerivedDates.get(edge.data.source)	
						let rangeB = contextDerivedDates.get(edge.data.target)								
											
						if(!rangeAfter(rangeA, rangeB)) {
							results.failedIDs.push(edge.data.id)
						} 
						results.tested++ 					
					})
				return results
			}
		}*/

		class PeriodShouldDefineDateRange extends tester {
			constructor() {
				super("Periods SHOULD define a date range", true)				
			}
			async test() {
				let results = { tested: 0, failedIDs: [] }
				store.getters.periods.forEach(async period => {	
					if(period.data?.dating?.minYear == null || period.data?.dating?.maxYear == null) {
						results.failedIDs.push(period.data.id)
					}
					results.tested++	
				})
				return results
			}
		}

		const tests = [			
			new PhasesMustContainContext(),
			new PhasesShouldDefineDateRange(),			
			new PhasesShouldBeAllocatedToPeriod(),
			new GroupContainsAtLeastOneContext(),
			new GroupMustBeAllocatedToPhase(),
			new GroupShouldBeAllocatedToPeriod(),
			new SubgroupMustContainContext(),
			new SubgroupParentMustBeGroup(),
			new SubgroupMustBeAllocatedToPhase(),
			new SubgroupShouldBeAllocatedToPeriod(),
			new ContextMustBeAllocatedToPhase(),
			new ContextShouldBeAllocatedToPeriod(),
			new ContextShouldBeAllocatedToGroup(),
			new ContextShouldHaveType(),
			new ContextPositionMustReflectStratigraphy(),
			//new ContextStratigraphySupportedByDating(),
			new PeriodShouldDefineDateRange()			
		]

		const rowCount = computed(() => tests.length)
		const filterCount = ref(tests.length)         
		watch(rowCount, (newValue) =>  filterCount.value = newValue)

		const refresh = () => {
			isBusy.value = true
			filter.value = ""
			
			// re-run all tests (aynchronously)
			Promise
				.allSettled(tests.map(async test => test.rerun()))
				.then(() => isBusy.value = false)
		}		
		
		return {
			isBusy, 
			filter,
			maxResults,
			rowCount,
			filterCount,
			onFiltered, 
			sortBy,
			sortDesc,
			fields,	
			tests,
			tableRowClass,
			refresh,
			setSelectedID,
			store
		}
	}
}
</script>

<style scoped>
a:hover >>> span {
	color: red;	
}
</style>