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
					:tbody-tr-class="tableRowClass"
					@row-selected="tableRowSelected">
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
//import { locales } from 'moment'
import {NodeClass} from "@/mixins/constants.js"

export default {
	name: 'Validation',
	components: { },
	mixins: [ ],
	props: { },
	data() {
		return {
			isBusy: false,
			filter: "",
            sortBy: "test",
			sortDesc: false,
			items: []
		}
	},
	computed: {	
		fields() {
			return [			
				{
					// virtual column with custom formatter
					key: "result",
					label: "result",
                    sortByFormatted: true,
					formatter: this.tableTestPassFormatter,
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
					label: "passed",
					sortByFormatted: true,
					formatter: (value, key, item) => item.results.filter(r => r.passed == true).length,
                    sortable: true,
					class: "text-right"														
				},
				{
					key: "failed",
					label: "failed",
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
        }        
	},
	methods: {
		tableTestPassFormatter(value, key, item) {
			if (item.results.length == 0) 
				return "N/A"
			else
				return item.results.some(result => result.passed == false) ? "✗" : "✓" 			
		},		
		tableRowSelected() {},
		tableRowClass(item, type) {
			if (!item || type !== 'row') 
				return "table-light"
			if (item.results.length == 0) 
				return "table-light"
			if (item.results.some(result => result.passed == false)) 
				if(item.optional) return 'table-warning'
				else return 'table-danger' 
			else return 'table-success'
		},
		
		clear() { this.items = [] },

        refresh() { 
			this.isBusy = true
			this.clear()

			// phase tests
			this.testPhaseContainsAtLeastOneContext()
			this.testPhaseDefinesDateRange()
			this.testPhaseAllocatedToPeriod()

			// group tests
			this.testGroupContainsAtLeastOneContext()
			this.testGroupAllocatedToPhase()			
			this.testGroupAllocatedToPeriod()

			// subgroup tests
			this.testSubgroupContainsAtLeastOneContext()						
			this.testSubgroupParentMustBeGroup()
			this.testSubgroupAllocatedToPhase()
			this.testSubgroupAllocatedToPeriod()

			// context tests
			this.testContextAboveContext() 	
			this.testContextAllocatedToPhase()	
			this.testContextAllocatedToPeriod()
			this.testContextHasType()

			// period tests
			this.testPeriodDefinesDateRange()
			this.isBusy = false
		},      
		
		// check for a valid dating range
		isValidRange(range) {
			if(!range) return false
			if(!Number.isInteger(range.minYear)) return false
			if(!Number.isInteger(range.maxYear)) return false
			return (range.minYear <= range.maxYear)
		},		

		// A before B?
		nodeBefore(idA, idB) {
			let rangeA = this.$store.getters.derivedDates(idA)
			let rangeB = this.$store.getters.derivedDates(idB)
			if(this.isValidRange(rangeA) && this.isValidRange(rangeB)) 
				return (rangeA.maxYear < rangeB.minYear)
			else
				return false	
		},
		nodeAfter(idA, idB) {
			return this.nodeBefore(idB, idA)
		},
		
		testNodeDescendantIsContext(node) {
			let descendants = this.$store.getters.descendantsOfID(node?.data?.id)
			return descendants.some(node => node.data?.class == NodeClass.CONTEXT)			
		},
		testNodeAllocatedToPhase(node) {
			let ancestors = this.$store.getters.ancestorsOfNode(node)			
			return ancestors.some(item => item.data.class == NodeClass.PHASE)		
		},
		testNodeAllocatedToPeriod(node) {
			return  node?.data?.period ? true : false		
		},
		
		testPhaseContainsAtLeastOneContext() {
			let test = { results: [], optional: false, testName: "Phases must contain at least one context" }
			this.$store.getters.phases.forEach(phase => {
				let passed = this.testNodeDescendantIsContext(phase)
				test.results.push({
					passed: passed,			
					description: `Phase "${phase.data.label}" ${passed ? "contains" : "does not contain"} contexts`	
				})								
			})
			this.items.push(test)				
		},

		testPhaseDefinesDateRange() {
			let test = { results: [], optional: true, testName: "Phases should define a date range" }
			this.$store.getters.phases.forEach(phase => {
				let passed = phase.data.dating.minYear && phase.data.dating.maxYear				
				test.results.push({
					passed: passed,				
					description: `Phase "${phase.data.label}" ${passed ? "defines" : "does not define"} a date range`	
				})					
			})
			this.items.push(test)	
		},

		testPhaseAllocatedToPeriod() {
			let test = { results: [], optional: true, testName: "Phases should be allocated to a period" }
			this.$store.getters.phases.forEach(phase => {	
				let passed = this.testNodeAllocatedToPeriod(phase)	
				test.results.push({
					passed: passed,				
					description: `Phase "${phase.data.label}" is ${passed ? "" : "not"} allocated to a period`		
				})				
			})
			this.items.push(test)				
		},

		testGroupContainsAtLeastOneContext() {
			let test = { results: [], optional: false, testName: "Groups must contain at least one context" }
			this.$store.getters.groups.forEach(group => {
				let passed = this.testNodeDescendantIsContext(group)
				test.results.push({
					passed: passed,				
					description: `Group "${group.data.label}" ${passed ? "contains" : "does not contain"} contexts`
				})						
			})
			this.items.push(test)	
		},

		testGroupAllocatedToPhase() {
			let test = { results: [], optional: false, testName: "Groups must be allocated to a phase" }
			this.$store.getters.groups.forEach(group => {				
				let passed = this.testNodeAllocatedToPhase(group)	
				test.results.push({
					passed: passed,				
					description: `Group "${group.data.label}" is ${passed ? "" : "not"} allocated to a phase`
				})							
			})
			this.items.push(test)	
		},

		testGroupAllocatedToPeriod() {
			let test = { results: [], optional: true, testName: "Groups should be allocated to a period" }
			this.$store.getters.groups.forEach(group => {							
				let passed = this.testNodeAllocatedToPeriod(group)
				test.results.push({
					passed: passed,				
					description: `Group "${group.data.label}" is ${passed ? "" : "not"} allocated to a period`
				})						
			})
			this.items.push(test)	
		},

		testSubgroupContainsAtLeastOneContext() {
			let test = { results: [], optional: false, testName: "Subgroups must contain at least one context" }
			this.$store.getters.subgroups.forEach(subgroup => {								
				let passed = this.testNodeDescendantIsContext(subgroup)
				test.results.push({
					passed: passed,				
					description: `Sub-Group "${subgroup.data.label}" ${passed ? "contains" : "does not contain"} contexts`
				})	
			})
			this.items.push(test)		
		},

		testSubgroupParentMustBeGroup() {
			let test = { results: [], optional: false, testName: "Subgroups must be allocated to a group" }
			this.$store.getters.subgroups.forEach(subgroup => {
				let parent = this.$store.getters.nodeByID(subgroup.data.parent)				
				let passed = parent?.data?.class == NodeClass.GROUP
				test.results.push({
					passed: passed,				
					description: `Subgroup "${subgroup.data.label}" is ${passed ? "": "not"} allocated to a group`
				})				
			})
			this.items.push(test)				
		},

		testSubgroupAllocatedToPhase() {
			let test = { results: [], optional: false, testName: "Subgroups must be allocated to a phase" }
			this.$store.getters.subgroups.forEach(subgroup => {								
				let passed = this.testNodeAllocatedToPhase(subgroup)
				test.results.push({
					passed: passed,				
					description: `Subgroup "${subgroup.data.label}" is ${passed ? "" : "not"} allocated to a phase`
				})					
			})
			this.items.push(test)			
		},

		testSubgroupAllocatedToPeriod() {
			let test = { results: [], optional: true, testName: "Subgroups should be allocated to a period" }
			this.$store.getters.subgroups.forEach(subgroup => {				
				let passed = this.testNodeAllocatedToPeriod(subgroup)
				test.results.push({
					passed: passed,				
					description: `Subgroup "${subgroup.data.label}" is ${passed ? "" : "not"} allocated to a period`
				})					
			})
			this.items.push(test)				
		},

		testContextAboveContext() {
			let test = { results: [], optional: false, testName: "Context stratigraphy supported by dating evidence?" }
			this.$store.getters.edges
				.filter(edge => edge.type = "above").forEach(edge => {											
					let sourceLabel = this.$store.getters.nodeLabel(edge.data.source)
					let targetLabel = this.$store.getters.nodeLabel(edge.data.target)
					let passed = this.nodeAfter(edge.data.source, edge.data.target)	
					test.results.push({
						passed: passed,				
						description: `"${sourceLabel}" above "${targetLabel}" is ${passed ? "" : "not"} supported by dating evidence`
				})					
			})
			this.items.push(test)	
		},

		testContextAllocatedToPhase() {
			let test = { results: [], optional: false, testName: "Contexts must be allocated to a phase" }
			this.$store.getters.contexts.forEach(context => {				
				let passed = this.testNodeAllocatedToPhase(context)		
				test.results.push({
					passed: passed,				
					description: `Context "${context.data.label}" is ${passed ? "" :  "not"} allocated to a phase`
				})						
			})
			this.items.push(test)		
		},

		testContextAllocatedToPeriod() {
			let test = { results: [], optional: true, testName: "Contexts should be allocated to a period" }
			this.$store.getters.contexts.forEach(context => {				
				let passed = this.testNodeAllocatedToPeriod(context)
				test.results.push({
					passed: passed,				
					description: `Context "${context.data.label}" is ${passed ? "" :  "not"} allocated to period`
				})						
			})
			this.items.push(test)		
		},

		testContextHasType() {
			let test = { results: [], optional: true, testName: "Contexts should have a type" }
			this.$store.getters.contexts.forEach(context => {				
				let passed = (context.data?.type || "").trim()  !== "" ? true : false		
				test.results.push({
					passed: passed,				
					description: `Context "${context.data.label}" ${passed ? "has" : "does not have"} a type`
				})								
			})
			this.items.push(test)
		},

		testPeriodDefinesDateRange() {
			let test = { results: [], optional: true, testName: "Periods should define a date range" }
			this.$store.getters.periods.forEach(period => {				
				let passed = period.data?.dating?.minYear !== null && period.data?.dating?.maxYear !== null	
				test.results.push({
					passed: passed,				
					description: `Period "${period.data.label}" does ${passed ? "" : "not"} define a date range`
				})							
			})
			this.items.push(test)	
		},

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
