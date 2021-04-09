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
						<span>Open...</span>						
						<b-form-file plain 
							id="fileOpen" 
							style="display: none" 							
							accept=".json"                
							@input="fileLoad">
						</b-form-file>					
					</b-dropdown-item-button>
					<!--<b-dropdown-item-button v-b-modal.modalFileOpenFromURL>
						<b-icon-upload class="mr-2" />
						<span>Open from URL...</span>	
						<FileOpenFromURL />							
					</b-dropdown-item-button>-->					
					<b-dropdown-item-button @click="fileSave">
						<b-icon-download class="mr-2" />
						<span>Save...</span>						
					</b-dropdown-item-button>					
					<b-dropdown-divider/>
					<b-dropdown-item-button v-b-modal.modalPeriodsImport>
						<b-icon-box-arrow-in-left class="mr-2" />
						<span>Import Perio.do collection...</span>	
						<PeriodsImport />							
					</b-dropdown-item-button>
					<b-dropdown-item-button v-b-modal.modalFileImport>
						<b-icon-box-arrow-in-left class="mr-2" />
						<span>Import context stratigraphy (CSV)...</span>
						<FileImport />						
					</b-dropdown-item-button>					
					<b-dropdown-item-button disabled>
						<b-icon-box-arrow-right class="mr-2" />
						<span>Export context stratigraphy (CSV)...</span>
					</b-dropdown-item-button>
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
					<b-dropdown-item-button @click="zoomIn">
						<b-icon-zoom-in class="mr-2" />
						<span>Zoom in</span>
					</b-dropdown-item-button>
					<b-dropdown-item-button @click="zoomOut">
						<b-icon-zoom-out class="mr-2" />
						<span>Zoom out</span>
					</b-dropdown-item-button>
					<b-dropdown-item-button @click="zoomFit">
						<b-icon-arrows-fullscreen class="mr-2" />
						<span>Zoom to fit</span>
					</b-dropdown-item-button>
					<b-dropdown-divider/>					
					<b-dropdown-item-button @click="redoLayout('dagre')">
						<b-icon-diagram-3 class="mr-2" />
						<span>Redo Layout</span>
					</b-dropdown-item-button>
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
						<span>About...</span>
						<HelpAbout />					
					</b-dropdown-item-button>
				</b-nav-item-dropdown>
			</b-navbar-nav>
		</b-collapse>
		<!--<b-navbar-brand href="#" id="brand" tag="h1" class="mb-0 primary">The Matrix</b-navbar-brand>-->
		<b-navbar-brand href="#" v-b-modal.modalAbout>
			<img src="phaser-spacedout-logo.png" height="25" alt="PHASER"/>
		</b-navbar-brand>
	</b-navbar>	
</template>

<script>
import FileImport from '@/components/FileImport'
//import FileOpenFromURL from '@/components/FileOpenFromURL'
import PeriodsImport from '@/components/PeriodsImport'
import HelpAbout from '@/components/HelpAbout'
import moment from 'moment'
import PhaserCommon from '@/mixins/PhaserCommon.js'

export default {
	name: 'MenuBar',
	components: {
		FileImport,
		//FileOpenFromURL,
		PeriodsImport,
		HelpAbout
	},
	mixins: [ PhaserCommon ],
	props: { },
	data: function() {
		return { }
	},
	computed: {	},
	methods: { 
		openFileDialog() {
			// programmatically display the file dialog
			document.getElementById("fileOpen").click() 
		},		

		clearAll() {
			let self = this
			self.$bvModal.msgBoxConfirm('This will clear all current data, are you sure?',{
				//title: 'New file',
				size: 'sm',
				buttonSize: 'sm',
				centered: true,
				okTitle: 'Yes',
				cancelTitle: 'No',
			}).then(value => {
				if(value) { 
					self.$store.dispatch('clearAll') 
					this.$root.$emit('diagramClear')
				}
			})	
		},
		
		fileLoad(file) {
			const self = this            
			if(!file) return
			
            const reader = new FileReader()
            reader.onload = function(e) { 
                const fileContents = JSON.parse(e.target.result)
                self.$store.dispatch('loadMatrixData', fileContents)				
            }
            reader.readAsText(file)
		},

		fileOpenFromURL() {

		},

		fileSave() {
			const data = { elements: this.$store.getters.elements }
			const fileName = `phaser-${ moment().format("YYYYMMDDHHmmss") }.json`
            this.saveToFile(JSON.stringify(data), fileName)
		},

		// this function from https://forum.vuejs.org/t/saving-form-data/38714
        saveToFile(jsonData, fileName) {
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
        },
		exportPartPNG() {
			// event bus - phaser diagram handles this
			this.$root.$emit('diagramExportPartPNG')			
		},
		exportFullPNG() {
			// event bus - phaser diagram handles this
			this.$root.$emit('diagramExportFullPNG')			
		},
		zoomIn() {
			// event bus - phaser diagram handles this
			this.$root.$emit('diagramZoomIn') 
		},
		zoomOut() {
			// event bus - phaser diagram handles this
			this.$root.$emit('diagramZoomOut') 
		},
		zoomFit() {
			// event bus - phaser diagram handles this
			this.$root.$emit('diagramZoomFit') 
		},
		redoLayout(name="dagre") {
			// event bus - phaser diagram handles this
			this.$root.$emit('diagramRedoLayout', name) 
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