import React, { FunctionComponent } from 'react';
import { SelectableValue } from '@grafana/data';
import { Segment } from '@grafana/ui';
import { useDispatch } from '../../../hooks/useStatelessReducer';
import { changeQueryType } from './state';
import { queryTypeConfig } from './utils';
import { segmentStyles } from '../styles';
import { ElasticsearchQueryType } from '../../../types';

const queryTypeOptions: Array<SelectableValue<ElasticsearchQueryType>> = Object.entries(queryTypeConfig).map(
  ([key, { label }]) => ({
    label,
    value: key as ElasticsearchQueryType,
  })
);

const toOption = (queryType: ElasticsearchQueryType) => ({
  label: queryTypeConfig[queryType].label,
  value: queryType,
});

interface Props {
  value: ElasticsearchQueryType;
}

export const QueryTypeEditor: FunctionComponent<Props> = ({ value }) => {
  const dispatch = useDispatch();

  return (
    <Segment
      className={segmentStyles}
      options={queryTypeOptions}
      onChange={e => dispatch(changeQueryType(e.value!))}
      value={toOption(value)}
    />
  );
};
