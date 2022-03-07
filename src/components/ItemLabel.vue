<template>
	<b-form-group
		:label="label" 
		label-for="itemLabel"
		label-size="md">	
		<b-form-input text 
			size="sm"
            :id="identifier"
			:disabled="disabled"
            :placeholder="placeholder"
            :value="value"
            class="shadow-sm"		
			type="text"
			name="itemLabel"            
			autocomplete="off"
			variant="primary"
            @input="changed"/>
	</b-form-group>
</template>

<script>
//import _uniqueId  from 'lodash/uniqueId'
import { computed } from '@vue/composition-api' // Vue 2 only. for Vue 3 use "from '@vue'"
import _uniqueId from 'lodash/uniqueId'

export default {
	props: {
        id: {
            type: String,
            required: false,
			default: null
        },
		disabled: {
			type: Boolean,
			required: false,
			default: false 
		},
        placeholder: {
            type: String,
			required: false,
			default: ""
        },
        value: {
            type: String,
			required: false,
			default: ""
        },
		label: {
            type: String,
			required: false,
			default: "Identifier"
        }
	},
	setup(props, context) {
		const identifier = computed(() => props.id || _uniqueId("itemlabel-"))
		const changed = (value) => context.emit('input', value)
		
		return { identifier, changed }
	}	
}
</script>