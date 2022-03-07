<template>
    <div>
        <div>Input: '{{ inputValue }}', selected: '{{ selectedOption }}'</div>
        <b-form-group 
            :label="label" 
            label-for="typeAheadInput">
            <b-form-input
                id="typeAheadInput"
                ref="input"
                type="search"
                :disabled="disabled"
                :placeholder="placeholder"
                :aria-label="placeholder"
                v-model="inputValue"
                :list="optionsId"
                @focus="isFocused = true"
                @blur="onBlur"                
                autocomplete="off"
            />
            <b-form-datalist :id="optionsId" v-show="isFocused && matchedOptions.length > 0">
                <b-form-select-option v-for="option in matchedOptions"
                    :key="option.value"
                    class="m-0 p-0" 
                    :value="option.text"
                    @click="onSelect">{{ option.text }}</b-form-select-option>
			</b-form-datalist>                        
        </b-form-group>
    </div>
</template>

<script>
import { ref, unref, computed, watch } from "@vue/composition-api" // Vue 2 only. for Vue 3 use "from '@vue'"
import _uniqueId from 'lodash/uniqueId'
export default {
    props: {
        nodes: {
            type: Array,
            required: false,
            default: () => [],
            validator: val => val instanceof Array
        },
        label: {
            type: String,
            required: false,
            default: 'Type a query:'
        },
        placeholder: {
            type: String,
            required: false,
            default: '(text to find)'
        },
        disabled: {
            type: Boolean,
            required: false,
            default: false
        },        
        minChars: {
            type: Number,
            required: false,
            default: 2
        },
        maxMatches: {
            type: Number,
            required: false,
            default: 10
        },
    },
    // loosely based on https://github.com/alexurquhart/vue-bootstrap-typeahead/blob/master/src/components/VueBootstrapTypeaheadList.vue
    // but implemented using composition API and BootstrapVue components
	setup(props) {		
        const optionsId = _uniqueId("datalist-")
        const inputValue = ref("")
        const selectedOption = ref(null)
        
        watch(selectedOption, async (newValue) => console.log(newValue))

        const isFocused = ref(false)
        const onBlur = () => isFocused.value = false        
        const onSelect = () => { console.log(`selected`); }

        const sanitize = s => s.replace(/</g, '&lt;').replace(/>/g, '&gt;')
        const escapeRegExp = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const escapedValue = s => escapeRegExp(sanitize(s))
    
        // convert nodes to options for select control                
        const nodesAsOptions = computed(() => {
            return props.nodes.map(item => {
                return {
                    value: item.data.id,
                    text: item.data.label
                }
            }) 
        })

        const highlight = text => {
            text = sanitize(text)
           if (unref(inputValue).length === 0) 
                return text
            
            const re = new RegExp(escapedValue(unref(inputValue)), 'gi')
            return text.replace(re, `<strong>xx$&</strong>`)
        }

        // options filtered by match on input
        const matchedOptions = computed(() => {
            if (unref(inputValue).length < props.minChars) 
                return []            

            const re = new RegExp(escapedValue(unref(inputValue)), 'gi')
            // Filter and sort matches
            return nodesAsOptions.value
                .filter(item => item.text.match(re) !== null)
                .map(item => {
                    item.html = highlight(item.text)
                    return item
                })
                .sort((a, b) => a.text > b.text ? 1 : -1)
                .slice(0, props.maxMatches)            
        })

		return { optionsId, inputValue, matchedOptions, selectedOption, isFocused, onBlur, onSelect }
	}
}
</script>