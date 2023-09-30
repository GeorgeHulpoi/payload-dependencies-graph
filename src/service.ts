import type { DependenciesGraphBase } from './dependencies-graph/base';
import { Subject } from './subject';
import type {
	DependenciesSchema,
	OnCollectionChangeArgs,
	OnCollectionDeleteArgs,
	OnGlobalChangeArgs,
} from './types';

/**
 * This class is an implementation for the service that is a singleton instance.
 * Through this class you interact with the plugin.
 */
class DependenciesGraphService extends Subject {
	/**
	 * Schema of dependencies generated by SchemaBuilder
	 */
	schema!: DependenciesSchema;

	/**
	 * The concrete instance of the dependencies graph
	 */
	dependenciesGraph!: DependenciesGraphBase;

	/**
	 * Function called exclusively by the `afterChange` hook in each collection.
	 *
	 * @param args
	 */
	async onCollectionChange(args: OnCollectionChangeArgs): Promise<void> {
		const { doc, previousDoc, collection, operation } = args;

		await this.dependenciesGraph.purgeDependentOn({
			collection,
			id: previousDoc.id,
		});

		await this.dependenciesGraph.extractDependenciesFromDoc(
			{
				collection,
				id: doc.id,
			},
			doc,
			this.schema.collections[collection] || [],
		);

		if (operation === 'create') {
			this.notifySubscribers({
				type: 'create',
				doc,
				collection,
			});
		} else if (operation === 'update') {
			this.notifySubscribers({
				type: 'update',
				doc,
				previousDoc,
				collection,
			});
		}
	}

	/**
	 * Function called exclusively by the `afterDelete` hook in each collection.
	 *
	 * @param args
	 */
	async onCollectionDelete(args: OnCollectionDeleteArgs): Promise<void> {
		const { id, doc, collection } = args;

		await this.dependenciesGraph.deleteResource({
			collection,
			id: id.toString(),
		});

		this.notifySubscribers({
			type: 'delete',
			doc,
			collection,
		});
	}

	/**
	 * Function called exclusively by the `afterChange` hook in each global.
	 *
	 * @param args
	 */
	async onGlobalChange(args: OnGlobalChangeArgs): Promise<void> {
		const { doc, previousDoc } = args;
		const resource = {
			global: doc.globalType,
		};

		await this.dependenciesGraph.purgeDependentOn(resource);

		await this.dependenciesGraph.extractDependenciesFromDoc(
			resource,
			doc,
			this.schema.globals[doc.globalType] || [],
		);

		this.notifySubscribers({
			type: 'update',
			doc,
			previousDoc,
			global: doc.globalType,
		});
	}
}

export default new DependenciesGraphService();
