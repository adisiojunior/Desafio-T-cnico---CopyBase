<template>
  <div class="file-upload">
    <div class="file-upload-header">
      <h3>{{ header }}</h3>
    </div>
    <div class="file-upload-container">
      <label :for="inputId" class="custom-file-input">
        <i class="fas fa-upload"></i> {{ buttonText }}
      </label>
      <input :id="inputId" type="file" @change="handleFileUpload" class="file-input">
      <span v-if="file" class="file-name">{{ file.name }}</span>
    </div>
    <button @click="uploadFile" class="upload-button"
      :disabled="!file || file.name === lastUploadedFileName || invalidFileFormat"
      :class="{ 'disabled': !file || file.name === lastUploadedFileName || invalidFileFormat }">
      <i class="fas fa-paper-plane"></i> {{ uploadButtonText }}
    </button>
    <p v-if="invalidFileFormat" class="error-message">{{ errorMessage }}</p>
  </div>
</template>

<script>
export default {
  props: {
    header: String,
    buttonText: String,
    uploadButtonText: String,
    errorMessage: String,
    inputId: String,
    handleFileUpload: Function,
    uploadFile: Function,
    file: Object,
    lastUploadedFileName: String,
    invalidFileFormat: Boolean
  }
};
</script>

<style scoped>
  @import "@/components/UploadStyles.css";
</style>