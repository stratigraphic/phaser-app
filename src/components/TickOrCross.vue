<template>
    <span v-if="value === true" class="text-success">{{ "✓" }}</span>
	<span v-else-if="value === false" class="text-danger">{{ "✗" }}</span>
    <span v-else>-</span>
</template>
<script>

export default {
    props: {
        value: {
            type: Boolean,
            required: false,
            default: null
        }
    },
	setup() {
		return {}
	}
}
</script>