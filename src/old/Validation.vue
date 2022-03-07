<template>
    <div class="m-2">
	<b-container fluid class="p-0">
		<b-row align-h="between">	
            <b-col>
				<b-button pill
					size="sm"
					variant="outline-primary"
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
						size="md"
						id="filter-input"
						class="shadow-sm"
						v-model="filter"
						type="search"
						autocomplete="off"
						placeholder="filter validation records"/>					
				</b-form-group>
			</b-col>
		</b-row>
		<b-row>
			<b-col>
				<b-table show-empty style="height: 600px;"
					id="datatable"
					:busy="isBusy"
					sort-icon-left
					hover outlined small 
					:no-border-collapse="true"
					sticky-header="600px" 
					select-mode="single"					
					primary-key="id"
					:items="items" 
					:fields="fields"
					:filter="filter"						
					class="overflow-auto shadow-sm mb-2"
					:tbody-tr-class="tableRowClass">
					<template #table-busy>
						<div class="text-center text-danger my-2">
							<b-spinner class="align-middle"></b-spinner>
							<strong>Validating...</strong>
						</div>
					</template>
					<template #cell(actions)="row">						
						<b-button size="sm" @click="row.toggleDetails">Details</b-button>
					</template>	
					<template #row-details="row">
						<b-card no-body>
						<b-list-group>
							<b-list-group-item v-for="(result, key) in row.item.results" 
								:key="key" 
								:variant="result.passed ? 'success': row.item.optional ? 'warning' : 'danger'">
								<span v-if="result.passed">✓</span>
								<span v-else>✗</span>
								<span class="ml-2">{{ result.description }}</span>
							</b-list-group-item>
						</b-list-group>
						</b-card>
					</template>								
				</b-table>								
			</b-col>
		</b-row>
	</b-container>
    </div>
</template>

<script>
import { ref, shallowRef, inject } from '@vue/composition-api' // Vue 2 only. for Vue 3 use "from '@vue'"
import { NodeClass, rangeAfter, isValidRange, isContext } from "@/composables/PhaserCommon"

export default {	
	setup() {
		const store = inject('store')  
		const isBusy = ref(false)
		const filter = ref("")
        const sortBy = ref("test")
		const sortDesc = ref(false)
		const items = shallowRef([])

		const fields = [			
			{
				// virtual column with custom formatter
				key: "result",
				label: "result",
                sortByFormatted: true,
				formatter: (value, key, item) => item.results.some(result => result.passed == false) ? "✗" : "✓",
				sortable: true,
				class: "text-center"														
			},
			{
				key: "testName",
				label: "description",
                sortable: true														
			},
			{
				key: "passed",
				label: "✓ passed",
				sortByFormatted: true,
				formatter: (value, key, item) => item.results.filter(r => r.passed == true).length,
                sortable: true,
				class: "text-right"														
			},
			{
				key: "failed",
				label: "✗ failed",
				sortByFormatted: true,
				formatter: (value, key, item) => item.results.filter(r => r.passed == false).length,
                sortable: true,
				class: "text-right"														
			},
			{
				// virtual column with custom formatter
				key: "total",
				label: "total",
                sortByFormatted: true,
				formatter: (value, key, item) => item.results.length,
				sortable: true,
				class: "text-right"													
			},
			{ key: 'actions', label: '' }
        ]
		
        const tableRowClass = (item, type) => {
			if (!item || type !== 'row') 
				return "table-light"
			if (item.results.length == 0) 
				return "table-light"
			if (item.results.some(result => result.passed == false)) 
				if(item.optional) return 'table-warning'
				else return 'table-danger' 
			else return 'table-success'
		}    

		const clear = () => items.value = []

        const refresh = () => { 
			isBusy.value = true
			clear()

			// run phase tests
			testPhaseContainsAtLeastOneContext()
			testPhaseDefinesDateRange()
			testPhaseAllocatedToPeriod()

			// run group tests
			testGroupContainsAtLeastOneContext()
			testGroupAllocatedToPhase()			
			testGroupAllocatedToPeriod()

			// run subgroup tests
			testSubgroupContainsAtLeastOneContext()						
			testSubgroupParentMustBeGroup()
			testSubgroupAllocatedToPhase()
			testSubgroupAllocatedToPeriod()

			// run context tests
			testContextAboveContext() 
			testContextPositionAboveContextPosition()	
			testContextAllocatedToPhase()	
			testContextAllocatedToPeriod()
			testContextHasType()

			// run period tests
			testPeriodDefinesDateRange()
			isBusy.value = false
		}
			
		const testNodeDescendantIsContext = (node) => {
			let descendants = store.getters.descendantsOfID(node?.data?.id)
			return descendants.some(node => node.data?.class == NodeClass.CONTEXT)			
		}

		const testNodeAllocatedToPhase = (node) => {
			let ancestors = store.getters.ancestorsOfNode(node)			
			return ancestors.some(item => item.data.class == NodeClass.PHASE)		
		}

		const testNodeAllocatedToPeriod = (node) => node?.data?.period ? true : false		
				
		const testPhaseContainsAtLeastOneContext = () => {
			let test = { results: [], optional: false, testName: "Phases must contain at least one context" }
			store.getters.phases.forEach(phase => {
				let passed = testNodeDescendantIsContext(phase)
				let label = store.getters.nodeLabel(phase, true)
				test.results.push({
					passed: passed,			
					description: `"${label}" ${passed ? "contains" : "does not contain"} contexts`	
				})								
			})
			items.value.push(test)				
		}

		const testPhaseDefinesDateRange = () => {
			let test = { results: [], optional: true, testName: "Phases should define a date range" }
			store.getters.phases.forEach(phase => {
				let passed = phase.data.dating.minYear && phase.data.dating.maxYear	
				let label = store.getters.nodeLabel(phase, true)			
				test.results.push({
					passed: passed,				
					description: `"${label}" ${passed ? "defines" : "does not define"} a date range`	
				})					
			})
			items.value.push(test)	
		}

		const testPhaseAllocatedToPeriod = () => {
			let test = { results: [], optional: true, testName: "Phases should be allocated to a period" }
			store.getters.phases.forEach(phase => {	
				let passed = testNodeAllocatedToPeriod(phase)	
				let label = store.getters.nodeLabel(phase, true)
				test.results.push({
					passed: passed,				
					description: `"${label}" is ${passed ? "" : "not"} allocated to a period`		
				})				
			})
			items.value.push(test)				
		}

		const testGroupContainsAtLeastOneContext = () => {
			let test = { results: [], optional: false, testName: "Groups must contain at least one context" }
			store.getters.groups.forEach(group => {
				let passed = testNodeDescendantIsContext(group)
				let label = store.getters.nodeLabel(group, true)
				test.results.push({
					passed: passed,				
					description: `"${label}" ${passed ? "contains" : "does not contain"} contexts`
				})						
			})
			items.value.push(test)
		}

		const testGroupAllocatedToPhase = () => {
			let test = { results: [], optional: false, testName: "Groups must be allocated to a phase" }
			store.getters.groups.forEach(group => {				
				let passed = testNodeAllocatedToPhase(group)
				let label = store.getters.nodeLabel(group, true)	
				test.results.push({
					passed: passed,				
					description: `"${label}" is ${passed ? "" : "not"} allocated to a phase`
				})							
			})
			items.value.push(test)
		}

		const testGroupAllocatedToPeriod = () => {
			let test = { results: [], optional: true, testName: "Groups should be allocated to a period" }
			store.getters.groups.forEach(group => {							
				let passed = testNodeAllocatedToPeriod(group)
				let label = store.getters.nodeLabel(group, true)
				test.results.push({
					passed: passed,				
					description: `"${label}" is ${passed ? "" : "not"} allocated to a period`
				})						
			})
			items.value.push(test)	
		}

		const testSubgroupContainsAtLeastOneContext = () => {
			let test = { results: [], optional: false, testName: "Subgroups must contain at least one context" }
			store.getters.subgroups.forEach(subgroup => {								
				let passed = testNodeDescendantIsContext(subgroup)
				let label = store.getters.nodeLabel(subgroup, true)
				test.results.push({
					passed: passed,				
					description: `"${label}" ${passed ? "contains" : "does not contain"} contexts`
				})	
			})
			items.value.push(test)		
		}

		const testSubgroupParentMustBeGroup = () => {
			let test = { results: [], optional: false, testName: "Subgroups must be allocated to a group" }
			store.getters.subgroups.forEach(subgroup => {
				let parent = store.getters.nodeByID(subgroup.data.parent)				
				let passed = parent?.data?.class == NodeClass.GROUP
				let label = store.getters.nodeLabel(subgroup, true)
				test.results.push({
					passed: passed,				
					description: `"${label}" is ${passed ? "": "not"} allocated to a group`
				})				
			})
			items.value.push(test)			
		}

		const testSubgroupAllocatedToPhase = () => {
			let test = { results: [], optional: false, testName: "Subgroups must be allocated to a phase" }
			store.getters.subgroups.forEach(subgroup => {								
				let passed = testNodeAllocatedToPhase(subgroup)
				let label = store.getters.nodeLabel(subgroup, true)
				test.results.push({
					passed: passed,				
					description: `"${label}" is ${passed ? "" : "not"} allocated to a phase`
				})					
			})
			items.value.push(test)
		}

		const testSubgroupAllocatedToPeriod = () => {
			let test = { results: [], optional: true, testName: "Subgroups should be allocated to a period" }
			store.getters.subgroups.forEach(subgroup => {				
				let passed = testNodeAllocatedToPeriod(subgroup)
				let label = store.getters.nodeLabel(subgroup, true)
				test.results.push({
					passed: passed,				
					description: `"${label}" is ${passed ? "" : "not"} allocated to a period`
				})					
			})
			items.value.push(test)				
		}

		const testContextAboveContext = () => {
			let test = { results: [], optional: false, testName: "Context stratigraphy supported by dating evidence?" }
			store.getters.edges
				.filter(edge => edge.data.type == "above")
				.forEach(edge => {
					let rangeA = store.getters.derivedDates(edge.data.source)	
					let rangeB = store.getters.derivedDates(edge.data.target)
					let label = store.getters.edgeLabel(edge)
					if(isValidRange(rangeA) && isValidRange(rangeB)) {
						let passed = rangeAfter(rangeA, rangeB)	
						
						test.results.push({
							passed: passed,				
							description: `${label} is ${passed ? "supported" : "contradicted"} by dating evidence`
						})
					}
				})
			items.value.push(test)
		}

		const testContextPositionAboveContextPosition = () => {
			let test = { results: [], optional: false, testName: "Context positions in diagram reflect stratigraphy?" }
			store.getters.edges
				.filter(edge => edge.data.type == "above")
				.forEach(edge => {
					let sourceNode = store.getters.nodeByID(edge.data.source)
					let targetNode = store.getters.nodeByID(edge.data.target)

					if(isContext(sourceNode) && isContext(targetNode)) {
						let labelA = store.getters.nodeLabel(sourceNode, true)
						let labelB = store.getters.nodeLabel(targetNode, true)

						let passed = sourceNode.position.y < targetNode.position.y

						test.results.push({
							passed: passed,				
							description: `"${labelA}" ${passed ? "is" : "should be"} above "${labelB}" in the diagram`
						})
					}
				})
			items.value.push(test)
		}

		const testContextAllocatedToPhase = () => {
			let test = { results: [], optional: false, testName: "Contexts must be allocated to a phase" }
			store.getters.contexts.forEach(context => {				
				let passed = testNodeAllocatedToPhase(context)
				let label = store.getters.nodeLabel(context, true)		
				test.results.push({
					passed: passed,				
					description: `"${label}" is ${passed ? "" :  "not"} allocated to a phase`
				})						
			})
			items.value.push(test)
		}

		const testContextAllocatedToPeriod = () => {
			let test = { results: [], optional: true, testName: "Contexts should be allocated to a period" }
			store.getters.contexts.forEach(context => {				
				let passed = testNodeAllocatedToPeriod(context)
				let label = store.getters.nodeLabel(context, true)
				test.results.push({
					passed: passed,				
					description: `"${label}" is ${passed ? "" :  "not"} allocated to period`
				})						
			})
			items.value.push(test)	
		}

		const testContextHasType = () => {
			let test = { results: [], optional: true, testName: "Contexts should have a type" }
			store.getters.contexts.forEach(context => {				
				let passed = (context.data?.type || "").trim()  !== "" ? true : false	
				let label = store.getters.nodeLabel(context, true)	
				test.results.push({
					passed: passed,				
					description: `"${label}" ${passed ? "has" : "does not have"} a type`
				})								
			})
			items.value.push(test)	
		}

		const testPeriodDefinesDateRange = () => {
			let test = { results: [], optional: true, testName: "Periods should define a date range" }
			store.getters.periods.forEach(period => {				
				let passed = period.data?.dating?.minYear !== null && period.data?.dating?.maxYear !== null	
				let label = store.getters.nodeLabel(period, true)
				test.results.push({
					passed: passed,				
					description: `"${label}" does ${passed ? "" : "not"} define a date range`
				})							
			})
			items.value.push(test)
		}

		return {
			isBusy, 
			filter, 
			sortBy,
			sortDesc,
			items,
			fields,			
			tableRowClass,
			clear,
			refresh
		}
	}
}
</script>