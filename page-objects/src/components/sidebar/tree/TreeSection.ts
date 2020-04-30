import { ViewSection } from "../ViewSection";
import { TreeItem } from "../ViewItem";

/**
 * Abstract representation of a view section containing a tree
 */
export abstract class TreeSection extends ViewSection {
    async openItem(...path: string[]): Promise<TreeItem[]> {
        let currentItem = await this.findItem(path[0], 1);
        let items: TreeItem[] = [];
    
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
                currentItem = items.find((value) => {
                    return value.getLabel() === path[i + 1];
                });
            }
        }
        return items;
    }

    abstract async findItem(label: string, maxLevel?: number): Promise<TreeItem | undefined>
    abstract async getVisibleItems(): Promise<TreeItem[]>
}
