<template>
	<div id="lock" 
        :title="locked ? 'locked' : 'unlocked'"
        :alt="locked ? 'locked' : 'unlocked'">
        <b-form-checkbox button             
			:checked="value" 
            @input="changed"
			:disabled="disabled"
            :button-variant="locked ? 'success' : 'danger'"
            class="shadow" 
            style="{ cursor: 'pointer' }">
            <b-icon-lock-fill v-if="locked"/>
            <b-icon-unlock-fill v-else/> 
        </b-form-checkbox>        
    </div><!--v-model="locked" @change="changed" -->
</template>

<script>

export default {
	name: 'Lock',
	components: { },
	mixins: [ ],
	props: {
		disabled: {
            type: Boolean,
            required: false,
            default: false
        },  
		value: {
			type: Boolean,
			required: true
		}
	},
	data() {
		return {}
	},
	computed: {
		locked: {
			get() { return this.value },
			set(value) { this.$emit('input', value) }
		}
	},
	methods: {
		changed(value) { this.locked = value }
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
