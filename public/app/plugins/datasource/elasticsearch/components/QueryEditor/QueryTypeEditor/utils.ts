import { ElasticsearchQueryType, QueryTypeConfiguration } from '../../../types';

export const queryTypeConfig: QueryTypeConfiguration = {
  [ElasticsearchQueryType.Lucene]: { label: 'Lucene' },
  [ElasticsearchQueryType.PPL]: { label: 'PPL' },
};
