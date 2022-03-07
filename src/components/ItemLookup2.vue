<template>
    <b-form-group
        :label="label"
        :label-for="selectorID">
        <b-dropdown block split
            size="sm"
            ref="dropdown"
            class="shadow-sm m-0 p-0"
            :disabled="disabled"
            menu-class="w-100"
            split-variant="link bg-white border-secondary"
            split-href="#"
            variant="primary border-secondary">
            <template #button-content>
                <a href="#" @click.stop="store.dispatch('setSelectedID', value)">
                    <NodeIconLink :nodeID="value"/>
                </a>
            </template>

            <template #default>
                <b-form-select 
                    :id="selectorID" 
                    class="shadow-sm p-0 m-0"
                    :disabled="disabled"                         
                    :select-size="8"
                    :value="value"
                    @change="onChange"  
                    @blur="onBlur"             
                    :options="options">
                    <template #first>
                        <b-form-select-option v-if="optionNone" value="">(none)</b-form-select-option>
                    </template>   
                </b-form-select>
            </template>
        </b-dropdown>
    </b-form-group>    
</template>

<script>
import { ref, computed, inject } from "@vue/composition-api" // Vue 2 only. for Vue 3 use "from '@vue'"
import _uniqueId from 'lodash/uniqueId'
import NodeIconLink from '@/components/NodeIconLink'

export default {
    components: { NodeIconLink },	
	props: {
        // enables/disables the composite control
        disabled: {
            type: Boolean,
            required: false,
            default: false
        },  
        // label for the composite control      
        label: {
            type: String, 
            required: false,
            default: "Select item"
        },
        // current selected value        
        value: {
            type: String,
            required: false,
            default: ""
        },
        // Whether to add '(none)' to the start of the lookup options
        optionNone: {
            type: Boolean,
            required: false,
            default: true
        },        
        // options to display. Expected format: [{ value: "xx", text: "x"}, {value: "yy", text: "y" }]
        // options may be grouped: [{ value: "xx", text: "x", options: [{value: "yy", text: "y" }] }]
		options: { 
			type: Array,
			required: false,
			default: () => []
		}		
	},
    setup(props, context) {
        const store = inject('store')

        // unique id for the control instance
        const selectorID = _uniqueId("selector-")
        // dropdown ref so we can hide it programmatically
        const dropdown = ref(null)

        // get text label of currently selected option, without asking store (if possible)
        // accounting for possibility of grouped options
        const selectedOptionLabel = computed(() => {
            // const selectedOption = props.options.find(item => item.value == props.value)
            const selectedOption = props.options
                .flatMap(item => item.options ? item.options : [item])
                .find(item => item.value == props.value)
            return selectedOption ? selectedOption.text : store.getters.labelByID(props.value, false)
        })
        
        const onChange = (value) => {
            //console.log(value)
            dropdown.value.hide() 
            context.emit('change', value)            
        }

        const onBlur = () => dropdown.value.hide() 
       
        return {
            store,
            dropdown,
            selectorID,
            selectedOptionLabel,
            onChange,
            onBlur
        }
    }
}
</script>

<style scoped>
a:hover {
	color:red;
}
</style>