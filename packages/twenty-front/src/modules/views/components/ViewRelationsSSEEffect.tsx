import { useListenToMetadataOperationBrowserEvent } from '@/browser-event/hooks/useListenToMetadataOperationBrowserEvent';
import { useSetAdvancedFilterDropdownStates } from '@/object-record/advanced-filter/hooks/useSetAdvancedFilterDropdownAllRowsStates';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { useListenToEventsForQuery } from '@/sse-db-event/hooks/useListenToEventsForQuery';
import { useGetCurrentViewOnly } from '@/views/hooks/useGetCurrentViewOnly';
import { useRefreshCoreViewsByObjectMetadataId } from '@/views/hooks/useRefreshCoreViewsByObjectMetadataId';
import { isDefined } from 'twenty-shared/utils';
import { useDebouncedCallback } from 'use-debounce';
import { AllMetadataName } from '~/generated-metadata/graphql';

export const ViewRelationsSSEEffect = () => {
  const { refreshCoreViewsByObjectMetadataId } =
    useRefreshCoreViewsByObjectMetadataId();
  const { setAdvancedFilterDropdownStates } =
    useSetAdvancedFilterDropdownStates();

  const { objectMetadataItem } = useRecordIndexContextOrThrow();

  const { currentView } = useGetCurrentViewOnly();

  const queryId = 'view-relations-metadata-sse-effect';

  useListenToEventsForQuery({
    queryId,
    operationSignature: {
      metadataName: AllMetadataName.viewFilter,
      variables: isDefined(currentView)
        ? {
            filter: {
              viewId: {
                eq: currentView?.id,
              },
            },
          }
        : {},
    },
  });

  useListenToEventsForQuery({
    queryId,
    operationSignature: {
      metadataName: AllMetadataName.viewField,
      variables: isDefined(currentView)
        ? {
            filter: {
              viewId: {
                eq: currentView?.id,
              },
            },
          }
        : {},
    },
  });

  useListenToEventsForQuery({
    queryId,
    operationSignature: {
      metadataName: AllMetadataName.viewFilterGroup,
      variables: isDefined(currentView)
        ? {
            filter: {
              viewId: {
                eq: currentView?.id,
              },
            },
          }
        : {},
    },
  });

  const debouncedRefreshCoreViewsByObjectMetadataId = useDebouncedCallback(
    (objectMetadataId: string) => {
      refreshCoreViewsByObjectMetadataId(objectMetadataId);
    },
    500,
    {
      leading: true,
      trailing: true,
    },
  );

  useListenToMetadataOperationBrowserEvent({
    metadataName: AllMetadataName.viewFilter,
    onMetadataOperationBrowserEvent: () => {
      debouncedRefreshCoreViewsByObjectMetadataId(objectMetadataItem.id);
    },
  });

  useListenToMetadataOperationBrowserEvent({
    metadataName: AllMetadataName.viewFilterGroup,
    onMetadataOperationBrowserEvent: () => {
      debouncedRefreshCoreViewsByObjectMetadataId(objectMetadataItem.id);
      setAdvancedFilterDropdownStates();
    },
  });

  useListenToMetadataOperationBrowserEvent({
    metadataName: AllMetadataName.viewField,
    onMetadataOperationBrowserEvent: () => {
      debouncedRefreshCoreViewsByObjectMetadataId(objectMetadataItem.id);
    },
  });

  return null;
};
