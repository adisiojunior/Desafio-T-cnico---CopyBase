<template>
  <div class="file-upload-container" v-if="response">
    <div class="card full-width">
      <h3>Dados:</h3>
      <div class="card-body">
        <div class="info-item">
          <strong>Title:</strong> {{ file?.name }}
        </div>
        <div class="info-item">
          <strong>Churn rate:</strong> {{ formatMRR(response?.churn_rate) }}
        </div>
        <div class="info-item">
          <strong>MRR Total:</strong> {{ formatMRR(response?.total_mrr) }}
        </div>
        <div class="info-item">
          <strong>Linhas processadas:</strong> {{ response?.processed_rows }}
        </div>
        <div class="info-item">
          <strong>Total de linhas:</strong> {{ response?.total_rows }}
        </div>
        <div class="info-item">
          <strong>Total de pessoas ativas:</strong> {{ response?.total_ativa }}
        </div>
        <div class="info-item">
          <strong>Total de cancelamentos:</strong> {{ response?.total_canceled }}
        </div>
        <div class="info-item">
          <strong>Total de atrasada:</strong> {{ response?.total_atrasada }}
        </div>
        <div class="info-item">
          <strong>Total de trial cancelado:</strong> {{ response?.total_trial_cancelado }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    response: {
      type: Object,
      required: true
    },
    file: {
      type: Object,
      required: true
    }
  },
  methods: {
    formatMRR(mrr) {
      if (typeof mrr !== 'number') {
        return 'N/A';
      }
      return mrr.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }
  }
};
</script>

<style scoped>
@import "@/components/UploadStyles.css";
</style>
