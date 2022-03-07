<template>
	<b-navbar toggleable="sm" id="nav" class="border-bottom">
		<b-navbar-toggle target="nav-collapse"/>
		<b-collapse id="nav-collapse" is-nav>	
			<b-navbar-nav>		
				<b-nav-item-dropdown text="File">
					<b-dropdown-item-button  @click="clearAll">
						<b-icon-file-earmark-plus class="mr-2" />
						<span>New</span>						
					</b-dropdown-item-button>
					<b-dropdown-item-button  @click="openFileDialog">
						<b-icon-upload class="mr-2" />
						<span>Open (JSON)...</span>						
						<b-form-file plain
							id="fileOpen" 
							style="display: none" 							
							accept=".json"                
							@input="loadJSON">
						</b-form-file>					
					</b-dropdown-item-button>					
					<!--<b-dropdown-item-button v-b-modal.modalFileOpenFromURL>
						<b-icon-upload class="mr-2" />
						<span>Open from URL...</span>	
						<FileOpenFromURL />							
					</b-dropdown-item-button>-->

					<b-dropdown-item-button @click="saveJSON">
						<b-icon-download class="mr-2" />
						<span>Save (JSON)...</span>						
					</b-dropdown-item-button>	

					<b-dropdown-divider/>

					<b-dropdown-item-button v-b-modal.modalPeriodsImport>
						<b-icon-box-arrow-in-left class="mr-2" />
						<NodeIcon :nodeClass="NodeClass.PERIOD"/>
						<span>Import Perio.do collection...</span>	
						<PeriodsImport />							
					</b-dropdown-item-button>

					<b-dropdown-divider/>

					<b-dropdown-group>

						<b-dropdown-header>
							<b-icon-box-arrow-in-left class="mr-2" />
							<span>Import CSV</span>
						</b-dropdown-header>

						<b-dropdown-item-button v-b-modal.modalCsvImport @click="setupModal('phases')">
						<NodeIcon :nodeClass="NodeClass.PHASE"/>
						<span>Phase records...</span>										
						</b-dropdown-item-button>

						<b-dropdown-item-button v-b-modal.modalCsvImport @click="setupModal('groups')">
							<NodeIcon :nodeClass="NodeClass.GROUP"/>
							<span>Group records...</span>										
						</b-dropdown-item-button>

						<b-dropdown-item-button v-b-modal.modalCsvImport @click="setupModal('subgroups')">
							<NodeIcon :nodeClass="NodeClass.SUBGROUP"/>
							<span>Subgroup records...</span>										
						</b-dropdown-item-button>

						<b-dropdown-item-button v-b-modal.modalCsvImport @click="setupModal('contexts')">
							<NodeIcon :nodeClass="NodeClass.CONTEXT"/>
							<span>Context records...</span>										
						</b-dropdown-item-button>

						<b-dropdown-item-button v-b-modal.modalCsvImport @click="setupModal('stratigraphy')">
							<NodeIcon :nodeClass="NodeClass.CONTEXT"/>
							<span>Context stratigraphy...</span>											
						</b-dropdown-item-button>

						<b-dropdown-item-button v-b-modal.modalCsvImport @click="setupModal('stratigraphyold')">
							<NodeIcon :nodeClass="NodeClass.CONTEXT"/>
							<span>Context stratigraphy (old)...</span>											
						</b-dropdown-item-button>

						<b-dropdown-item-button v-b-modal.modalCsvImport @click="setupModal('datings')">
							<NodeIcon :nodeClass="NodeClass.DATING"/>
							<span>Dating records...</span>						
						</b-dropdown-item-button>

						<b-dropdown-item-button v-b-modal.modalCsvImport @click="setupModal('periods')">
							<NodeIcon :nodeClass="NodeClass.PERIOD"/>
							<span>Period records...</span>							
						</b-dropdown-item-button>
						
						<CsvImport :mode="csvImportMode" />
					</b-dropdown-group>

										
					<b-dropdown-divider/>
					<b-dropdown-group>
						<b-dropdown-header>
							<b-icon-box-arrow-right class="mr-2" />
							<span>Export CSV</span>
						</b-dropdown-header>

						<b-dropdown-item-button @click="saveDelimited(NodeClass.PHASE)">
							<NodeIcon :nodeClass="NodeClass.PHASE"/>
							<span>Phase records...</span>										
						</b-dropdown-item-button>

						<b-dropdown-item-button @click="saveDelimited(NodeClass.GROUP)">
							<NodeIcon :nodeClass="NodeClass.GROUP"/>
							<span>Group records...</span>										
						</b-dropdown-item-button>

						<b-dropdown-item-button @click="saveDelimited(NodeClass.SUBGROUP)">
							<NodeIcon :nodeClass="NodeClass.SUBGROUP"/>
							<span>Subgroup records...</span>										
						</b-dropdown-item-button>

						<b-dropdown-item-button @click="saveDelimited(NodeClass.CONTEXT)">
							<NodeIcon :nodeClass="NodeClass.CONTEXT"/>
							<span>Context records...</span>											
						</b-dropdown-item-button>

						<b-dropdown-item-button @click="saveDelimited('edge')">
							<NodeIcon :nodeClass="NodeClass.CONTEXT"/>
							<span>Context stratigraphy...</span>											
						</b-dropdown-item-button>

						<b-dropdown-item-button @click="saveDelimited(NodeClass.DATING)">
							<NodeIcon :nodeClass="NodeClass.DATING"/>
							<span>Dating records...</span>						
						</b-dropdown-item-button>

						<b-dropdown-item-button @click="saveDelimited(NodeClass.PERIOD)">
							<NodeIcon :nodeClass="NodeClass.PERIOD"/>
							<span>Period records...</span>						
						</b-dropdown-item-button>
					</b-dropdown-group>					

					<b-dropdown-divider/>

					<b-dropdown-item-button @click="exportPartPNG">
						<b-icon-box-arrow-right class="mr-2" />
						<span>Export visible diagram (PNG)...</span>
					</b-dropdown-item-button>

					<b-dropdown-item-button @click="exportFullPNG">
						<b-icon-box-arrow-right class="mr-2" />
						<span>Export full diagram (PNG)...</span>
					</b-dropdown-item-button>	

				</b-nav-item-dropdown>
				<b-nav-item-dropdown text="View">

					<b-dropdown-item-button @click="diagramZoomIn">
						<b-icon-zoom-in class="mr-2" />
						<span>Zoom in</span>
					</b-dropdown-item-button>

					<b-dropdown-item-button @click="diagramZoomOut">
						<b-icon-zoom-out class="mr-2" />
						<span>Zoom out</span>
					</b-dropdown-item-button>

					<b-dropdown-item-button @click="diagramZoomFit">
						<b-icon-arrows-fullscreen class="mr-2" />
						<span>Zoom to fit</span>
					</b-dropdown-item-button>

					<b-dropdown-divider/>

					<b-dropdown-item-button @click="diagramRefresh">
						<b-icon-arrow-clockwise class="mr-2" />
						<span>Refresh diagram</span>
					</b-dropdown-item-button>

					<b-dropdown-item-button @click="toggleLock">						
            			<span v-if="locked">
							<b-icon-lock-fill class="mr-2"/>						
							<span>Unlock diagram</span>
						</span>
						<span v-else>
							<b-icon-unlock-fill class="mr-2"/> 			
							<span>Lock diagram</span>
						</span>
					</b-dropdown-item-button>

					<b-dropdown-item-button @click="diagramRedoLayout('dagre')" :disabled="locked">
						<b-icon-diagram-3 class="mr-2" />
						<span>Redo Layout</span>
					</b-dropdown-item-button>

					<!--<b-dropdown-divider/>	
					<b-dropdown-item-button v-b-modal.modalTemporalRelationships>
						<b-icon-calendar-range class="mr-2" />
						<span>Temporal Relationships...</span>
						<TemporalRelationships />
					</b-dropdown-item-button>-->
					<!--
					<b-dropdown-item-button @click="redoLayout('elk')">
						<b-icon-diagram-3 class="mr-2" />
						<span>Redo Layout (ELK)</span>
					</b-dropdown-item-button>
					<b-dropdown-item-button @click="redoLayout('klay')">
						<b-icon-diagram-3 class="mr-2" />
						<span>Redo Layout (KLAY)</span>
					</b-dropdown-item-button>
					<b-dropdown-item-button @click="redoLayout('breadthfirst')">
						<b-icon-diagram-3 class="mr-2" />
						<span>Redo Layout (BreadthFirst)</span>
					</b-dropdown-item-button>
					-->
				</b-nav-item-dropdown>
				<b-nav-item-dropdown text="Help">
					<b-dropdown-item-button v-b-modal.modalAbout>
						<b-icon-question-circle class="mr-2" />
						<span>{{ `About ${ store.getters.appName }...` }}</span>
						<HelpAbout />					
					</b-dropdown-item-button>
				</b-nav-item-dropdown>
			</b-navbar-nav>
		</b-collapse>
		<!--<b-navbar-brand href="#" id="brand" tag="h1" class="mb-0 primary">The Matrix</b-navbar-brand>-->
		<b-navbar-brand href="#" v-b-modal.modalAbout>
			<img src="phaser-spacedout-logo.png" width="94" height="25" alt="PHASER"/>
		</b-navbar-brand>
	</b-navbar>	
</template>

<script>
import { inject, ref, computed } from '@vue/composition-api' // Vue 2 only. for Vue 3 use "from '@vue'"
import CsvImport from '@/components/CsvImport'
//import FileOpenFromURL from '@/components/FileOpenFromURL'
import PeriodsImport from '@/components/PeriodsImport'
import HelpAbout from '@/components/HelpAbout'
import NodeIcon from '@/components/NodeIcon'
//import moment from 'moment'
import EventBus from '@/composables/EventBus.js'
import { NodeClass, EdgeClass, timestamp } from '@/composables/PhaserCommon'
import Papa from "papaparse"

//npm run seeimport TemporalRelationships from '@/components/TemporalRelationships'

export default {
	components: {
		CsvImport,
		//FileOpenFromURL,
		PeriodsImport,
		HelpAbout,
		NodeIcon
		//TemporalRelationships
	},

	setup(props, context) {
		const store = inject('store')  
		// programmatically display the file dialog
		const openFileDialog = () => document.getElementById("fileOpen").click()


		const locked = computed({
            get () { return store.getters.diagramLock },
            set (newValue) {
                store.dispatch('setDiagramLock', newValue) 
            }            
        })
		const toggleLock = () =>  locked.value = !locked.value

		const clearAll = () => {
			// todo - this works but is deprecated, needs correct syntax
			context.root.$bvModal.msgBoxConfirm('This will clear all current data, are you sure?',{
				//title: 'New file',
				size: 'sm',
				buttonSize: 'sm',
				centered: true,
				okTitle: 'Yes',
				cancelTitle: 'No',
			}).then(value => {
				if(value) { 
					store.dispatch('clearAll') 
					EventBus.$emit('diagram-clear')
				}
			})	
		}

		const csvImportMode = ref("contexts")
		const setupModal = (mode) => csvImportMode.value = mode

		const loadJSON = (file) => {
			if(!file) return
			EventBus.$emit('diagram-clear')
            const reader = new FileReader()
            reader.onload = function(e) { 

                const fileContents = JSON.parse(e.target.result)
                store.dispatch('loadMatrixData', fileContents)				
            }
            reader.readAsText(file)
		}

		const saveJSON = () => {
			const data = { 
				about: store.getters.about,
				elements: {
					nodes: store.getters.nodes,
					edges: store.getters.edges
				}
			}
			// const fileName = `phaser-${ moment().format("YYYYMMDDHHmmss") }.json`
			const fileName = `phaser-${ timestamp() }.json`
            saveToFile(JSON.stringify(data), fileName)
		}

		// NEW - TODO: CSV export functions...
		const saveDelimited = (itemClass, delimiter=",") => {
			let data = ""
			switch(itemClass) {				
				case NodeClass.PHASE: data = phasesToDelimited(delimiter);break;
				case NodeClass.GROUP: data = groupsToDelimited(delimiter);break;
				case NodeClass.SUBGROUP: data = subgroupsToDelimited(delimiter);break;	
				case NodeClass.CONTEXT: data = contextsToDelimited(delimiter);break;
				case NodeClass.DATING: data = datingsToDelimited(delimiter);break;
				case NodeClass.PERIOD: data = periodsToDelimited(delimiter);break;	
				case EdgeClass.EDGE: data = edgesToDelimited(delimiter);break;		
			}
			//console.log(data)
			const fileName = `phaser-${itemClass}s-${ timestamp() }.csv` //todo...
            saveToFile(data, fileName)			
		}

		const phasesToDelimited = (delimiter=",") => {
			let data = store.getters.phases.map(node => {
				return {
					siteCode: node.data.siteCode || "",
					phaseID: node.data.label || "",
					minYear: node.data.dating.minYear,
					maxYear: node.data.dating.maxYear,	
					description: node.data.description || "",	
					withinPeriod: store.getters.labelByID(node.data.period)		
				}
            })
            let delimited = Papa.unparse(JSON.stringify(data), { delimiter: delimiter })            
            return delimited
		}
		const groupsToDelimited = (delimiter=",") => {
			let data = store.getters.groups.map(node => {
				return {
					siteCode: node.data.siteCode || "",
					groupID: node.data.label || "",
					groupType: node.data.type || "",
					cud: node.data.cud || "",
					description: node.data.description || "",	
					withinPeriod: store.getters.labelByID(node.data.period),
					withinPhase: store.getters.labelByID(node.data.parent)						
				}
            })
            let delimited = Papa.unparse(JSON.stringify(data), { delimiter: delimiter })            
            return delimited
		}
		const subgroupsToDelimited = (delimiter=",") => {
			let data = store.getters.subgroups.map(node => {
				return {
					siteCode: node.data.siteCode || "",
					subgroupID: node.data.label || "",
					subgroupType: node.data.type || "",
					cud: node.data.cud || "",
					description: node.data.description || "",	
					withinPeriod: store.getters.labelByID(node.data.period),
					withinGroup: store.getters.labelByID(node.data.parent)						
				}
            })
            let delimited = Papa.unparse(JSON.stringify(data), { delimiter: delimiter })            
            return delimited
		}
		const contextsToDelimited = (delimiter=",") => {		

			let data = store.getters.contexts.map(node => {
				let parentNode = store.getters.nodeByID(node.data.parent) 
				let parentClass = parentNode?.data?.class || ""
				let parentLabel = parentNode?.data?.label || ""
				return {
					siteCode: node.data.siteCode || "",
					contextID: node.data.label || "",
					contextType: node.data.type || "",
					cud: node.data.cud || "",
					description: node.data.description || "",	
					withinPeriod: store.getters.labelByID(node.data.period),
					withinPhase: parentClass == NodeClass.PHASE ? parentLabel : "",
					withinGroup: parentClass == NodeClass.GROUP ? parentLabel : "",
					withinSubGroup: parentClass == NodeClass.SUBGROUP ? parentLabel : "",						
				}
            })
            let delimited = Papa.unparse(JSON.stringify(data), { delimiter: delimiter })            
            return delimited
		}
		const datingsToDelimited = (delimiter=",") => {
			let data = store.getters.datings.map(node => {
				return {
					siteCode: node.data.siteCode || "",
					datingID: node.data.label || "",
					datingType: node.data.type || "",
					description: node.data.description || "",	
					minYear: node.data.dating.minYear,
					maxYear: node.data.dating.maxYear,					
					withinPeriod: store.getters.labelByID(node.data.period),
					withinContext: store.getters.labelByID(node.data.parent)
				}
            })
            let delimited = Papa.unparse(JSON.stringify(data), { delimiter: delimiter })            
            return delimited
		}
		const periodsToDelimited = (delimiter=",") => {
			let data = store.getters.periods.map(node => {
				return {
					periodID: node.data.label || "",
					description: node.data.description || "",
					uri: node.data.uri || "",	
					minYear: node.data.dating.minYear,
					maxYear: node.data.dating.maxYear										
				}
            })
            let delimited = Papa.unparse(JSON.stringify(data), { delimiter: delimiter })            
            return delimited
		}
		const edgesToDelimited = (delimiter=",") => {
			let data = store.getters.edges.map(edge => {
				return {
					siteCode: edge.data.siteCode || "",
					sourceID: store.getters.labelByID(edge.data.source),
					stratRelationship: edge.data.type || "",
					targetID: store.getters.labelByID(edge.data.target)						
				}
            })
            let delimited = Papa.unparse(JSON.stringify(data), { delimiter: delimiter })            
            return delimited
		}

		// this function from https://forum.vuejs.org/t/saving-form-data/38714
        const saveToFile = (jsonData, fileName) => {
            let blob = new Blob([jsonData], { type: 'text/plain;charset=utf-8;' })
            if (navigator.msSaveBlob) { // IE 10+
                navigator.msSaveBlob(blob, fileName)
            } else {
                let link = document.createElement('a')
                if (link.download !== undefined) { // feature detection
                    // Browsers that support HTML5 download attribute
                    let url = URL.createObjectURL(blob)
                    link.setAttribute('href', url)
                    link.setAttribute('download', fileName)
                    link.style.visibility = 'hidden'
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                }
            }
        }

		// event bus calls - phaser diagram component has handlers for these			
		const exportPartPNG = () => EventBus.$emit('diagram-export-part-png')			
		const exportFullPNG = () => EventBus.$emit('diagram-export-full-png')
		const diagramRefresh = () => EventBus.$emit("diagram-refresh")			
		const diagramZoomIn = () => EventBus.$emit("diagram-zoom-in")	
		const diagramZoomOut = () => EventBus.$emit('diagram-zoom-out') 		
		const diagramZoomFit = () => EventBus.$emit('diagram-zoom-fit') 		
		const diagramRedoLayout = (name="dagre") => EventBus.$emit('diagram-redo-layout', name)
		
		return {
			locked,
			toggleLock,
			NodeClass,
			setupModal,
			csvImportMode,
			openFileDialog, 
			clearAll,
			loadJSON,
			saveJSON,
			saveDelimited,
			saveToFile,
			exportPartPNG,
			exportFullPNG,
			diagramRefresh,
			diagramZoomIn,
			diagramZoomOut,
			diagramZoomFit,
			diagramRedoLayout,
			store
		}
	}	
}
</script>

<style scoped>
#nav {
	background:whitesmoke;	
}
#brand {
	color: darkgray;
}
</style>