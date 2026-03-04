import { useListenToMetadataOperationBrowserEvent } from '@/browser-event/hooks/useListenToMetadataOperationBrowserEvent';
import { type MetadataOperationBrowserEventDetail } from '@/browser-event/types/MetadataOperationBrowserEventDetail';
import { useListenToEventsForQuery } from '@/sse-db-event/hooks/useListenToEventsForQuery';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useGetViewById } from '@/views/hooks/useGetViewById';
import { useRefreshCoreViewsByObjectMetadataId } from '@/views/hooks/useRefreshCoreViewsByObjectMetadataId';
import { coreViewsState } from '@/views/states/coreViewState';
import { type ViewField } from '@/views/types/ViewField';
import { type ViewFilter } from '@/views/types/ViewFilter';
import { type ViewFilterGroup } from '@/views/types/ViewFilterGroup';
import { type Nullable } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { useDebouncedCallback } from 'use-debounce';
import { AllMetadataName } from '~/generated-metadata/graphql';

export const ViewRelationsSSEEffect = () => {
  const { refreshCoreViewsByObjectMetadataId } =
    useRefreshCoreViewsByObjectMetadataId();

  const { getViewById } = useGetViewById();

  const coreViews = useAtomStateValue(coreViewsState);

  useListenToEventsForQuery({
    queryId: 'view-filters-sse-effect',
    operationSignature: {
      metadataName: AllMetadataName.viewFilter,
      variables: {},
    },
  });

  useListenToEventsForQuery({
    queryId: 'view-fields-sse-effect',
    operationSignature: {
      metadataName: AllMetadataName.viewField,
      variables: {},
    },
  });

  useListenToEventsForQuery({
    queryId: 'view-filter-groups-sse-effect',
    operationSignature: {
      metadataName: AllMetadataName.viewFilterGroup,
      variables: {},
    },
  });

  // TODO: replace this with detailed SSE optimistic effects
  const debouncedRefreshCoreViewsByObjectMetadataId = useDebouncedCallback(
    (objectMetadataId: string) => {
      refreshCoreViewsByObjectMetadataId(objectMetadataId);
    },
    500,
    {
      leading: false,
      trailing: true,
    },
  );

  const getViewIdFromViewSSERelationEventDetail = <
    T extends ViewFilter | ViewFilterGroup | ViewField,
  >(
    eventDetail: MetadataOperationBrowserEventDetail<T>,
  ) => {
    switch (eventDetail.operation.type) {
      case 'create': {
        return eventDetail.operation.createdRecord?.viewId as Nullable<string>;
      }
      case 'update': {
        return eventDetail.operation.updatedRecord?.viewId as Nullable<string>;
      }
      case 'delete': {
        const deletedRecordId = eventDetail.operation.deletedRecordId;

        switch (eventDetail.metadataName) {
          case AllMetadataName.viewFilter:
            return coreViews.find((view) =>
              view.viewFilters.some((filter) => filter.id === deletedRecordId),
            )?.id;
          case AllMetadataName.viewField:
            return coreViews.find((view) =>
              view.viewFields.some((field) => field.id === deletedRecordId),
            )?.id;
          case AllMetadataName.viewFilterGroup:
            return coreViews.find((view) =>
              view.viewFilterGroups?.some(
                (group) => group.id === deletedRecordId,
              ),
            )?.id;
          default:
            return null;
        }
      }
    }
  };

  const getObjectMetadataItemIdFromViewRelationEventDetail = <
    T extends ViewFilter | ViewFilterGroup | ViewField,
  >(
    eventDetail: MetadataOperationBrowserEventDetail<T>,
  ) => {
    const viewId = getViewIdFromViewSSERelationEventDetail(eventDetail);

    if (!isDefined(viewId)) {
      return null;
    }

    const { view } = getViewById(viewId);

    if (!isDefined(view)) {
      return null;
    }

    return view.objectMetadataId;
  };

  useListenToMetadataOperationBrowserEvent({
    metadataName: AllMetadataName.viewFilter,
    onMetadataOperationBrowserEvent: (
      detail: MetadataOperationBrowserEventDetail<ViewFilter>,
    ) => {
      const objectMetadataItemId =
        getObjectMetadataItemIdFromViewRelationEventDetail(detail);

      if (!isDefined(objectMetadataItemId)) {
        return;
      }

      debouncedRefreshCoreViewsByObjectMetadataId(objectMetadataItemId);
    },
  });

  useListenToMetadataOperationBrowserEvent({
    metadataName: AllMetadataName.viewFilterGroup,
    onMetadataOperationBrowserEvent: (
      detail: MetadataOperationBrowserEventDetail<ViewFilterGroup>,
    ) => {
      const objectMetadataItemId =
        getObjectMetadataItemIdFromViewRelationEventDetail(detail);

      if (!isDefined(objectMetadataItemId)) {
        return;
      }

      debouncedRefreshCoreViewsByObjectMetadataId(objectMetadataItemId);
    },
  });

  useListenToMetadataOperationBrowserEvent({
    metadataName: AllMetadataName.viewField,
    onMetadataOperationBrowserEvent: (
      detail: MetadataOperationBrowserEventDetail<ViewField>,
    ) => {
      const objectMetadataItemId =
        getObjectMetadataItemIdFromViewRelationEventDetail(detail);

      if (!isDefined(objectMetadataItemId)) {
        return;
      }

      debouncedRefreshCoreViewsByObjectMetadataId(objectMetadataItemId);
    },
  });

  return null;
};
