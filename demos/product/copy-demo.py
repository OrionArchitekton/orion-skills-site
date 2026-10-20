"""Copy one public skill into temporary demonstration directories only."""
from pathlib import Path
from tempfile import TemporaryDirectory
import argparse,shutil,hashlib,json
parser=argparse.ArgumentParser();parser.add_argument('skill_source',type=Path);a=parser.parse_args()
source=(a.skill_source/'SKILL.md').read_bytes()
if hashlib.sha256(source).hexdigest()!='de5c5d5c190dfe918f8af42e0c3c7daba1c91de87101ad25a41f08589bee46aa':
 parser.error('Select the reviewed v0.6.0 prove-deploy-is-live SKILL.md')
def copy_missing(source,target):
 if target.exists():return 'preserved'
 shutil.copytree(source,target);return 'copied'
with TemporaryDirectory(prefix='skill-copy-demo-') as temporary:
 target=Path(temporary)/'skills'/a.skill_source.name;target.parent.mkdir()
 first=copy_missing(a.skill_source,target)
 if first!='copied':raise RuntimeError('First copy did not create the destination')
 observed=(target/'SKILL.md').read_bytes()
 if source!=observed:raise RuntimeError('Copied skill differs from the reviewed source')
 second=copy_missing(a.skill_source,target)
 if second!='preserved' or (target/'SKILL.md').read_bytes()!=observed:
  raise RuntimeError('Existing destination was not preserved')
 print(json.dumps({'skill':a.skill_source.name,'source':'v0.6.0','skill_md_present':True,'same_sha256_as_source':hashlib.sha256(observed).hexdigest(),'existing_destination_preserved':True,'active_agent_settings_changed':False}))
