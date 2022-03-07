<template>
	<div class="lock" 
        :title="locked ? 'locked' : 'unlocked'"
        :alt="locked ? 'locked' : 'unlocked'">
        <b-form-checkbox button
			size="sm"
			:checked="value" 
            @input="changed"
			:disabled="disabled"
			:button-variant="locked ? 'success' : 'danger'"
			class="shadow">
            <b-icon-lock-fill v-if="locked"/>
            <b-icon-unlock-fill v-else/> 
        </b-form-checkbox>        
   	</div>
</template>

<script>
import { ref, computed } from '@vue/composition-api' // Vue 2 only. for Vue 3 use "from '@vue'"

export default {
	props: {
		disabled: {
            type: Boolean,
            required: false,
            default: false
        },  
		value: {
			type: Boolean,
			required: false,
			default: true
		}
	},
	setup(props, context) {
		const locked = ref(props.value) 
		
		const changed = (newValue) => {
			locked.value = newValue 
			context.emit('input', newValue) 
		}

		return { locked, changed }
	}
}
</script>

<style scoped>
	.lock { cursor: pointer }
</style>
