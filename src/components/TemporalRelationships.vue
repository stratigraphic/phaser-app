<template>	
    <b-container fluid class="p-2">
        <b-row align-h="between">
            <b-col style="text-align: left">
                <b-input-group prepend="Phase" size="sm">                        
                    <b-form-select 
                        :plain="true"
                        name="phase-selector" 
                        class="shadow-sm"
                        v-model="selectedPhaseID"
                        :options1="phaseLookupOptions"
                        placeholder="select phase"> 
                        <b-form-select-option v-for="option in phaseLookupOptions" :key="option.value" :value="option.value">
                            <!--<NodeIcon :width="16" :height="16" nodeClass="phase" text="P"/>-->
                            <span>{{ option.text }}</span>
                        </b-form-select-option>
                    </b-form-select>
                </b-input-group>                  
            </b-col>
            <b-col>
                <b-input-group>
                    <template #prepend>
                        <b-icon-search height="10" class="m-2"/>
                    </template>
                        
                    <b-form-input 
                        size="sm"
                        id="filter-input"
                        class="shadow-sm"
                        v-model="filter"
                        :disabled="!selectedPhaseID"
                        type="search"
                        autocomplete="off"
                        placeholder="filter results"/>                  				
                    </b-input-group>
                </b-col> 
            </b-row>            
            <b-row>
                <b-col>
                    <PhaseDTR :phaseID="selectedPhaseID" :filter="filter"/>
                </b-col>
            </b-row>
           <b-row>
                <b-col>
                    <hr>
                </b-col>
            </b-row>
            <b-row>
                <b-col>
                    <PhaseDSR :phaseID="selectedPhaseID" :filter="filter"/>
                </b-col>
            </b-row>
    </b-container>
</template>

<script>
import { ref, inject, computed, watch } from '@vue/composition-api' // Vue 2 only. for Vue 3 use "from '@vue'"

import PhaseDTR from "@/components/PhaseDTR"
import PhaseDSR from "@/components/PhaseDSR"
//import NodeIcon from '@/components/NodeIcon'

export default {
    components: { 
        PhaseDTR, 
        PhaseDSR, 
        //NodeIcon 
    },
    setup() {
        const store = inject("store")
		const filter = ref("")	

        const selectedPhaseID = ref("")
        // if phase selection changes, clear the table filter
        watch(selectedPhaseID, () => { filter.value = "" })

        const selectedPhaseLabel = computed(() => store.getters.labelByID(selectedPhaseID.value))
        const phaseLookupOptions = computed(() => store.getters.phaseOptions.concat({value: '', text: '(none)', selected: true}))

        return { store, filter, phaseLookupOptions, selectedPhaseID, selectedPhaseLabel }
    }

}
</script>