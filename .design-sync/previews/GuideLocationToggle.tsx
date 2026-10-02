import { GuideLocationToggle } from '@mystay/design-system'

export const Inactive = () => <GuideLocationToggle active={false} loading={false} denied={false} onRequest={() => {}} onClear={() => {}} />
export const Loading = () => <GuideLocationToggle active={false} loading denied={false} onRequest={() => {}} onClear={() => {}} />
export const Active = () => <GuideLocationToggle active loading={false} denied={false} onRequest={() => {}} onClear={() => {}} />
export const Denied = () => <GuideLocationToggle active={false} loading={false} denied onRequest={() => {}} onClear={() => {}} />
