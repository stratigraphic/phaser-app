<template>
    <div>
	<b-form-group class="px-2 shadow-sm"  label="Raw Dates: 14C age in 14C yr BP">
        <template v-slot:label>
            <span>Raw Dates: </span>
            <span style="font-style: italic">14C age in 14C yr BP</span>
        </template>
        <b-form-row>             
            <b-col>
                <b-form-group class="my-2"
                    label="Minimum (Earliest) year"
                    label-for="minRawYearInput">
                    <b-form-input string 
                        :disabled="disabled" 
                        placeholder="14C age in 14C yr BP"
                        name="minRawYearInput" 
                        class="shadow-sm"
                        :value="local.label" 
                        @change="changed('label', $event)"/>
                </b-form-group> 

                <b-input-group class="my-2" prepend="±" append="years">
                    <b-form-input string 
                        :disabled="disabled" 
                        placeholder="Error Value +/-"
                        name="errorValue" 
                        class="shadow-sm"
                        :value="local.errorValue" 
                        @change="changed('errorValue', $event)"/>
                </b-input-group> 
            </b-col>
            <b-col>
                <b-form-group class="my-2" 
                    label="Laboratory code for determination"
                    label-for="labCode">
                    <b-input-group prepend="Lab Code">
                    <b-form-input string
                        :disabled="disabled" 
                        placeholder="Laboratory code"
                        name="labCode" 
                        class="shadow-sm"
                        :value="local.labCode" 
                        @change="changed('labCode', $event)"/>
                    </b-input-group>
                </b-form-group> 

                <b-input-group class="my-2">
                    <b-form-input string 
                        :disabled="disabled" 
                        placeholder="The sample code of material dated"
                        name="sampleCode" 
                        class="shadow-sm"
                        :value="local.sampleCode" 
                        @change="changed('sampleCode', $event)"/>
                </b-input-group> 
            </b-col>
        </b-form-row>
    </b-form-group>
    <b-form-group class="px-2 shadow-sm"  label="Calibrated Dates">        
        <b-form-row>            
            <b-col>
                <b-form-group class="my-2"
                    label="Minimum (Earliest) year"
                    label-for="minYearInput">
                    <b-form-input number 
                        :disabled="disabled" 
                        placeholder="Minimum year"
                        name="minYearInput" 
                        class="shadow-sm"
                        :value="local.minYear" 
                        @change="changed('minYear', $event)"/>
                </b-form-group> 

                <b-input-group class="my-2">
                    <b-form-input string 
                        :disabled="disabled" 
                        placeholder="1st/2nd/3rd Sigma?"
                        name="minYearSigma" 
                        class="shadow-sm"
                        :value="local.minYearSigma" 
                        @change="changed('minYearSigma', $event)"/>
                </b-input-group> 
            </b-col>
            <b-col>
                <b-form-group class="my-2"
                    label="Maximum (Latest) year"
                    label-for="maxYearInput">
                    <b-form-input number 
                        :disabled="disabled" 
                        placeholder="Maximum year"
                        name="maxYearInput" 
                        class="shadow-sm"
                        :value="local.maxYear" 
                        @change="changed('maxYear', $event)"/>
                </b-form-group> 

                <b-input-group class="my-2">
                    <b-form-input string
                        :disabled="disabled" 
                        placeholder="1st/2nd/3rd Sigma?"
                        name="maxYearSigma" 
                        class="shadow-sm"
                        :value="local.maxYearSigma" 
                        @change="changed('maxYearSigma', $event)"/>
                </b-input-group> 
            </b-col>
        </b-form-row>
	</b-form-group>
    </div>
</template>

<script>
import { computed } from '@vue/composition-api' // Vue 2 only. for Vue 3 use "from '@vue'"

export default {
	props: {
        disabled: {
            type: Boolean,
            required: false,
            default: false
        },       
        dating: {
            type: Object,
			required: false,
			default: null
        }    
    },
    setup(props, context) {
        const local = computed(() => {
            const dating = (props.dating || {})
            return {
                minYear: Number(dating["minYear"] || null),  
                maxYear: Number(dating["maxYear"] || null),  
                minYearTolValue: Number(dating["minYearTolValue"] || 0),  
                maxYearTolValue: Number(dating["maxYearTolValue"] || 0),  
                minYearTolUnit: dating["minYearTolUnit"] || "years",
                maxYearTolUnit: dating["maxYearTolUnit"] || "years",
                minYearSigma: dating["minYearSigma"] || "",
                maxYearSigma: dating["maxYearSigma"] || "",
                label: dating["label"] || "",
                labCode: dating["labCode"] || "",
                sampleCode: dating["sampleCode"] || "",
                errorValue: dating["errorValue"] || "",
            }
        })
        
        const changed = (key, value) => context.emit('change', { ...props.dating, [key]: value })
       
        return { local, changed }
    }
}
</script>


