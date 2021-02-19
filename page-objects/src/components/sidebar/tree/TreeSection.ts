import { ViewSection } from "../ViewSection";
import { TreeItem } from "../ViewItem";

/**
 * Abstract representation of a view section containing a tree
 */
export abstract class TreeSection extends ViewSection {
    async openItem(...path: string[]): Promise<TreeItem[]> {
        let items: TreeItem[] = [];
    
        for (let i = 0; i < path.length; i++) {
            const item = await this.findItem(path[i], i + 1);
            if (await item?.hasChildren() && !await item?.isExpanded()) {
                await item?.click();
            }
        }

        let currentItem = await this.findItem(path[0], 1);
        for (let i = 0; i < path.length; i++) {
            if (!currentItem) {
                throw new Error(`Item ${path[i]} not found`);
            }
            items = await currentItem.getChildren();
            if (items.length < 1) {
                await currentItem.select();
                return items;
            }
            if (i + 1 < path.length) {
                currentItem = undefined;
                for (const item of items) {
                    if (await item.getLabel() === path[i + 1]) {
                        currentItem = item;
                        break;
                    }
                }
            }
        }
        return items;
    }

    abstract findItem(label: string, maxLevel?: number): Promise<TreeItem | undefined>
    abstract getVisibleItems(): Promise<TreeItem[]>
}
